import path from 'node:path'

import logger from '@wdio/logger'
import { deepmerge } from 'deepmerge-ts'
import type { Capabilities, Options, Services } from '@wdio/types'

import RequireLibrary from './RequireLibrary.js'
import FileSystemPathService from './FileSystemPathService.js'
import {
    removeLineNumbers, isCucumberFeatureWithLineNumber, validObjectOrArray,
    loadAutoCompilers, makeRelativeToCWD
} from '../utils.js'
import { SUPPORTED_HOOKS, SUPPORTED_FILE_EXTENSIONS, DEFAULT_CONFIGS, NO_NAMED_CONFIG_EXPORT } from '../constants.js'

import type { PathService, ModuleImportService } from '../types.js'

const log = logger('@wdio/config:ConfigParser')

type Spec = string | string[]
type ESMImport = { config?: TestrunnerOptionsWithParameters }
type DefaultImport = { default?: { config?: TestrunnerOptionsWithParameters } }
type ImportedConfigModule = ESMImport | DefaultImport

interface TestrunnerOptionsWithParameters extends Omit<Options.Testrunner, 'capabilities'> {
    watch?: boolean
    coverage?: boolean
    spec?: string[]
    suite?: string[]
    capabilities?: Capabilities.RemoteCapabilities
    rootDir: string
}

interface MergeConfig extends Omit<Partial<TestrunnerOptionsWithParameters>, 'specs' | 'exclude'> {
    specs?: Spec[]
    exclude?: string[]
}

export default class ConfigParser {
    #isInitialised = false
    #configFilePath: string
    private _config: TestrunnerOptionsWithParameters
    private _capabilities: Capabilities.RemoteCapabilities = []

    constructor(
        configFilePath: string,
        /**
         * config options parsed in via CLI arguments and applied before
         * trying to compile config file
         */
        private _initialConfig: Partial<TestrunnerOptionsWithParameters> = {},
        private _pathService: PathService = new FileSystemPathService(),
        private _moduleRequireService: ModuleImportService = new RequireLibrary()
    ) {
        this.#configFilePath = configFilePath
        this._config = Object.assign(
            { rootDir: path.dirname(configFilePath) },
            DEFAULT_CONFIGS()
        )

        /**
         * specs applied as CLI arguments should be relative from CWD
         * rather than relative to the config file
         */
        if (_initialConfig.spec) {
            _initialConfig.spec = makeRelativeToCWD(_initialConfig.spec) as string[]
        }
        this.merge(_initialConfig)
    }

    /**
     * initializes the config object
     */
    async initialize (object: MergeConfig = {}) {
        /**
         * only run auto compile functionality once but allow the config parse to be initialised
         * multiple times, e.g. when used with the packages/wdio-cli/src/watcher.ts
         */
        if (!this.#isInitialised) {
            await loadAutoCompilers(this._config.autoCompileOpts!, this._moduleRequireService)
            await this.addConfigFile(this.#configFilePath)
        }

        this.merge({ ...object })

        /**
         * enable/disable coverage reporting
         */
        if (Object.keys(this._initialConfig || {}).includes('coverage')) {
            if (this._config.runner === 'browser') {
                this._config.runner = ['browser', {
                    coverage: { enabled: this._initialConfig.coverage }
                }]
            } else if (Array.isArray(this._config.runner) && this._config.runner[0] === 'browser') {
                (this._config.runner[1] as any).coverage = {
                    ...(this._config.runner[1] as any).coverage,
                    enabled: this._initialConfig.coverage
                }
            }
        }

        this.#isInitialised = true
    }

    /**
     * merges config file with default values
     * @param {String} filename path of file relative to current directory
     */
    private async addConfigFile(filename: string) {
        if (typeof filename !== 'string') {
            throw new Error('addConfigFile requires filepath')
        }

        /**
         * resolve config file path always relative to working directory
         */
        const filePath = this._pathService.ensureAbsolutePath(filename, process.cwd())

        try {
            /**
             * Check if direct exports got assigned as default exports and if so
             * be more flexible and pick allow for these as well.
             */
            const importedModule = await this._pathService.loadFile<ImportedConfigModule>(filePath)
            const config = (importedModule as ESMImport).config || (importedModule as DefaultImport).default?.config
            if (typeof config !== 'object') {
                throw new Error(NO_NAMED_CONFIG_EXPORT)
            }

            /**
             * clone the original config
             */
            const fileConfig = Object.assign({}, config)

            /**
             * merge capabilities
             */
            const defaultTo: Capabilities.RemoteCapabilities = Array.isArray(this._capabilities) ? [] : {}
            this._capabilities = deepmerge(this._capabilities, fileConfig.capabilities || defaultTo)
            delete fileConfig.capabilities

            /**
             * Add hooks from the file config and remove them from file config object to avoid
             * complications when using merge function
             */
            this.addService(fileConfig)
            for (const hookName of SUPPORTED_HOOKS) {
                delete fileConfig[hookName]
            }

            this._config = deepmerge(this._config, fileConfig)

            /**
             * remove `watch` from config as far as it can be only passed as command line argument
             */
            delete this._config.watch
        } catch (e: any) {
            log.error(`Failed loading configuration file: ${filePath}:`, e.message)
            throw e
        }
    }

    /**
     * merge external object with config object
     * @param  {Object} object  desired object to merge into the config object
     */
    private merge(object: MergeConfig = {}) {
        const spec = Array.isArray(object.spec) ? object.spec : []
        const exclude = Array.isArray(object.exclude) ? object.exclude : []
        this._config = deepmerge(this._config, object) as TestrunnerOptionsWithParameters

        /**
         * overwrite config specs that got piped into the wdio command
         */
        if (object.specs && object.specs.length > 0) {
            this._config.specs = object.specs as string[]
        } else if (object.exclude && object.exclude.length > 0) {
            this._config.exclude = object.exclude as string[]
        }

        /**
         * cleanup duplicated "suite" if the same value was provided
         */
        if (object.suite && object.suite.length > 0) {
            this._config.suite = this._config.suite?.filter((suite, idx, suites) => suites.indexOf(suite) === idx)
        }

        /**
         * overwrite capabilities
         */
        this._capabilities = validObjectOrArray(this._config.capabilities) ? this._config.capabilities : this._capabilities

        /**
         * save original specs if Cucumber's feature line number is provided
         */
        if (this._config.spec && isCucumberFeatureWithLineNumber(this._config.spec)) {
            /**
             * `this._config.spec` is string instead of Array in watch mode
             */
            this._config.cucumberFeaturesWithLineNumbers = Array.isArray(this._config.spec) ? [...this._config.spec] : [this._config.spec]
        }

        /**
         * run single spec file only, regardless of multiple-spec specification
         */
        if (spec.length > 0) {
            this._config.specs = this.setFilePathToFilterOptions(spec, this._config.specs!)
        }
        if (exclude.length > 0) {
            this._config.exclude = this.setFilePathToFilterOptions(exclude, this._config.exclude!)
        }
    }

    /**
     * Add hooks from an existing service to the runner config.
     * @param {Object} service - an object that contains hook methods.
     */
    addService(service: Services.Hooks) {
        const addHook = (hookName: string, hook: Function) => {
            // @ts-ignore Expression produces a union type that is too complex to represent
            const existingHooks = this._config[hookName]
            if (!existingHooks) {
                // @ts-ignore Expression produces a union type that is too complex to represent
                this._config[hookName] = hook.bind(service)
            } else if (typeof existingHooks === 'function') {
                // @ts-ignore Expression produces a union type that is too complex to represent
                this._config[hookName] = [existingHooks, hook.bind(service)]
            } else {
                // @ts-ignore Expression produces a union type that is too complex to represent
                this._config[hookName] = [...existingHooks, hook.bind(service)]
            }
        }

        for (const hookName of SUPPORTED_HOOKS) {
            const hooksToBeAdded = service[hookName]
            if (!hooksToBeAdded) {
                continue
            }

            if (typeof hooksToBeAdded === 'function') {
                addHook(hookName, hooksToBeAdded)
            } else if (Array.isArray(hooksToBeAdded)) {
                for (const hookToAdd of hooksToBeAdded) {
                    if (typeof hookToAdd === 'function') {
                        addHook(hookName, hookToAdd)
                    }
                }
            }
        }
    }

    /**
     * determine what specs to run based on the spec(s), suite(s), exclude
     * attributes from CLI, config and capabilities
     */
    getSpecs(capSpecs?: Spec[], capExclude?: Spec[]) {
        const isSpecParamPassed = Array.isArray(this._config.spec)
        // when CLI --spec is explicitly specified, this._config.specs contains the filtered
        // specs matching the passed pattern else the specs defined inside the config are returned
        let specs = ConfigParser.getFilePaths(this._config.specs!, this._config.rootDir, this._pathService)
        let exclude = ConfigParser.getFilePaths(this._config.exclude!, this._config.rootDir, this._pathService)
        const suites = Array.isArray(this._config.suite) ? this._config.suite : []

        // only use capability excludes if (CLI) --exclude or config exclude are not defined
        if (Array.isArray(capExclude) && exclude.length === 0){
            exclude = ConfigParser.getFilePaths(capExclude, this._config.rootDir, this._pathService)
        }

        // only use capability specs if (CLI) --spec is not defined
        if (!isSpecParamPassed && Array.isArray(capSpecs)){
            specs = ConfigParser.getFilePaths(capSpecs, this._config.rootDir, this._pathService)
        }

        // handle case where user passes --suite via CLI
        if (suites.length > 0) {
            let suiteSpecs: Spec[] = []
            for (const suiteName of suites) {
                const suite = this._config.suites?.[suiteName]
                if (!suite) {
                    log.warn(`No suite was found with name "${suiteName}"`)
                }
                if (Array.isArray(suite)) {
                    suiteSpecs = suiteSpecs.concat(ConfigParser.getFilePaths(suite, this._config.rootDir, this._pathService))
                }
            }

            if (suiteSpecs.length === 0) {
                throw new Error(`The suite(s) "${suites.join('", "')}" you specified don't exist ` +
                    'in your config file or doesn\'t contain any files!')
            }

            // Allow --suite and --spec to both be defined on the command line
            specs = isSpecParamPassed ? [...specs, ...suiteSpecs] : suiteSpecs
        }

        // Remove any duplicate tests from the final specs array
        specs = [...new Set(specs)]

        return this.filterSpecs(specs, <string[]>exclude)
    }

    /**
     * sets config attribute with file paths from filtering
     * options from cli argument
     *
     * @param  {String[]} cliArgFileList  list of files in a string form
     * @param  {Object} config  config object that stores the spec and exclude attributes
     * cli argument
     * @return {String[]} List of files that should be included or excluded
     */
    setFilePathToFilterOptions(cliArgFileList: string[], specs: Spec[]) {
        const filesToFilter = new Set<string>()
        const fileList = ConfigParser.getFilePaths(specs, this._config.rootDir, this._pathService)
        cliArgFileList.forEach(filteredFile => {
            filteredFile = removeLineNumbers(filteredFile)
            // Send single file/file glob to getFilePaths - not supporting hierarchy in spec/exclude
            // Return value will always be string[]
            const globMatchedFiles = <string[]>ConfigParser.getFilePaths(
                this._pathService.glob(filteredFile, path.dirname(this.#configFilePath)),
                this._config.rootDir,
                this._pathService
            )
            if (this._pathService.isFile(filteredFile)) {
                filesToFilter.add(
                    this._pathService.ensureAbsolutePath(
                        filteredFile,
                        path.dirname(this.#configFilePath)
                    )
                )
            } else if (globMatchedFiles.length) {
                globMatchedFiles.forEach(file => filesToFilter.add(file))
            } else {
                // fileList can be a string[] or a string[][]
                fileList.forEach(file => {
                    if (typeof file === 'string') {
                        if (file.match(filteredFile)) {
                            filesToFilter.add(file)
                        }
                    } else if (Array.isArray(file)) {
                        file.forEach(subFile => {
                            if (subFile.match(filteredFile)) {
                                filesToFilter.add(subFile)
                            }
                        })
                    } else {
                        log.warn('Unexpected entry in specs that is neither string nor array: ', file)
                    }
                })
            }
        })
        if (filesToFilter.size === 0) {
            throw new Error(`spec file(s) ${cliArgFileList.join(', ')} not found`)
        }
        return [...filesToFilter]
    }

    /**
     * return configs
     */
    getConfig () {
        if (!this.#isInitialised) {
            throw new Error('ConfigParser was not initialised, call "await config.initialize()" first!')
        }
        return this._config as Required<Options.Testrunner>
    }

    /**
     * return capabilities
     */
    getCapabilities(i?: number) {
        if (!this.#isInitialised) {
            throw new Error('ConfigParser was not initialised, call "await config.initialize()" first!')
        }

        if (typeof i === 'number' && Array.isArray(this._capabilities) && this._capabilities[i]) {
            return this._capabilities[i]
        }

        return this._capabilities
    }

    /**
     * returns a flattened list of globbed files
     *
     * @param  {String[] | String[][]} patterns list of files to glob
     * @param  {Boolean} omitWarnings to indicate omission of warnings
     * @param  {FileSystemPathService} findAndGlob system path service for expanding globbed file names
     * @param  {number} hierarchyDepth depth to prevent recursive calling beyond a depth of 1
     * @return {String[] | String[][]} list of files
     */
    static getFilePaths(patterns: Spec[], rootDir: string, findAndGlob: PathService = new FileSystemPathService(), hierarchyDepth?: number) {
        let files: Spec[] = []
        let groupedFiles: string[] = []

        if (typeof patterns === 'string') {
            patterns = [patterns]
        }

        // patterns must be an array of strings and/or string arrays
        if (!Array.isArray(patterns)) {
            throw new Error('specs or exclude property should be an array of strings, specs may also be an array of string arrays')
        }

        patterns = patterns.map(pattern => {
            if (Array.isArray(pattern)) {
                return pattern.map(subPattern => removeLineNumbers(subPattern))
            }
            return removeLineNumbers(pattern)
        })

        for (let pattern of patterns) {
            // If pattern is an array, then call getFilePaths again
            // But only call one level deep, can't have multiple levels of hierarchy
            if (Array.isArray(pattern) && !hierarchyDepth) {
                // Will always only get a string array back
                groupedFiles = <string[]>ConfigParser.getFilePaths(pattern, rootDir, findAndGlob, 1)
                files.push(groupedFiles)
            } else if (Array.isArray(pattern) && hierarchyDepth) {
                log.error('Unexpected depth of hierarchical arrays')
            } else if ((pattern as string).startsWith('file://')) {
                // files are already absolute, no need to glob them
                files.push(pattern)
            } else {
                pattern = pattern.toString().replace(/\\/g, '/')
                let filenames = findAndGlob.glob(<string>pattern, rootDir)
                filenames = filenames.filter(
                    (filename) => SUPPORTED_FILE_EXTENSIONS.find(
                        (ext) => filename.endsWith(ext)))

                filenames = filenames.map(filename => findAndGlob.ensureAbsolutePath(filename, rootDir))

                if (filenames.length === 0) {
                    log.warn('pattern', pattern, 'did not match any file')
                }
                files = [...files, ...filenames]
            }
        }
        return files
    }

    /**
     * returns specs files with the excludes filtered
     *
     * @param  {String[] | String[][]} spec files -  list of spec files
     * @param  {String[]} exclude files -  list of exclude files
     * @return {String[] | String[][]} list of spec files with excludes removed
     */
    filterSpecs(specs: Spec[], exclude: string[]) {
        return specs.reduce((returnVal: Spec[], spec) => {
            if (Array.isArray(spec)) {
                returnVal.push(spec.filter(specItem => !exclude.includes(specItem)))
            } else if (exclude.indexOf(spec) === -1) {
                returnVal.push(spec)
            }
            return returnVal
        }, [])
    }
}
