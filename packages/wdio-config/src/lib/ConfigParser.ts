import merge from 'deepmerge'
import logger from '@wdio/logger'
import type { Capabilities, Options, Services } from '@wdio/types'

import RequireLibrary from './RequireLibrary.js'
import FileSystemPathService from './FileSystemPathService.js'
import {
    removeLineNumbers, isCucumberFeatureWithLineNumber, validObjectOrArray,
    loadAutoCompilers
} from '../utils.js'
import { SUPPORTED_HOOKS, SUPPORTED_FILE_EXTENSIONS, DEFAULT_CONFIGS } from '../constants.js'

import type { PathService, ModuleImportService } from '../types'

const log = logger('@wdio/config:ConfigParser')
const MERGE_OPTIONS = { clone: false }

type Spec = string | string[]

interface TestrunnerOptionsWithParameters extends Omit<Options.Testrunner, 'capabilities'> {
    watch?: boolean
    spec?: string[]
    suite?: string[]
    capabilities?: Capabilities.RemoteCapabilities
}

interface MergeConfig extends Omit<Partial<TestrunnerOptionsWithParameters>, 'specs' | 'exclude'> {
    specs?: Spec[]
    exclude?: string[]
}

export default class ConfigParser {
    private _config: TestrunnerOptionsWithParameters = DEFAULT_CONFIGS()
    private _capabilities: Capabilities.RemoteCapabilities = []

    constructor(
        private _pathService: PathService = new FileSystemPathService(),
        private _moduleRequireService: ModuleImportService = new RequireLibrary()
    ) {}

    async autoCompile() {
        /**
         * on launcher compile files if Babel or TypeScript are installed using our defaults
         */
        if (this._config.autoCompileOpts && !(await loadAutoCompilers(this._config.autoCompileOpts!, this._moduleRequireService))) {
            log.debug('No compiler found, continue without compiling files')
        }
    }

    /**
     * merges config file with default values
     * @param {String} filename path of file relative to current directory
     */
    async addConfigFile(filename: string) {
        if (typeof filename !== 'string') {
            throw new Error('addConfigFile requires filepath')
        }

        const filePath = this._pathService.ensureAbsolutePath(filename)

        try {
            const config = (await this._pathService.loadFile<{ config: TestrunnerOptionsWithParameters }>(filePath)).config

            if (typeof config !== 'object') {
                throw new Error('addConfigEntry requires config key')
            }

            /**
             * clone the original config
             */
            const fileConfig = merge<Omit<Options.Testrunner, 'capabilities'> & { capabilities?: Capabilities.RemoteCapabilities }>(config, {}, MERGE_OPTIONS)

            /**
             * merge capabilities
             */
            const defaultTo: Capabilities.RemoteCapabilities = Array.isArray(this._capabilities) ? [] : {}
            this._capabilities = merge<Capabilities.RemoteCapabilities>(this._capabilities, fileConfig.capabilities || defaultTo, MERGE_OPTIONS)
            delete fileConfig.capabilities

            /**
             * Add hooks from the file config and remove them from file config object to avoid
             * complications when using merge function
             */
            this.addService(fileConfig)
            for (let hookName of SUPPORTED_HOOKS) {
                delete fileConfig[hookName]
            }

            this._config = merge(this._config, fileConfig, MERGE_OPTIONS)

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
    merge(object: MergeConfig = {}) {
        const spec = Array.isArray(object.spec) ? object.spec : []
        const exclude = Array.isArray(object.exclude) ? object.exclude : []
        this._config = merge(this._config, object, MERGE_OPTIONS) as TestrunnerOptionsWithParameters

        /**
         * overwrite config specs that got piped into the wdio command
         */
        if (object.specs && object.specs.length > 0) {
            this._config.specs = object.specs as string[]
        } else if (object.exclude && object.exclude.length > 0) {
            this._config.exclude = object.exclude as string[]
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
     * get excluded files from config pattern
     */
    getSpecs(capSpecs?: string[], capExclude?: string[]) {
        let specs = ConfigParser.getFilePaths(this._config.specs!, undefined, this._pathService)
        let spec = Array.isArray(this._config.spec) ? this._config.spec : []
        let exclude = ConfigParser.getFilePaths(this._config.exclude!, undefined, this._pathService)
        let suites = Array.isArray(this._config.suite) ? this._config.suite : []

        /**
         * check if user has specified a specific suites to run
         */
        if (suites.length > 0) {
            let suiteSpecs: Spec[] = []
            for (let suiteName of suites) {
                let suite = this._config.suites?.[suiteName]
                if (!suite) {
                    log.warn(`No suite was found with name "${suiteName}"`)
                }
                if (Array.isArray(suite)) {
                    suiteSpecs = suiteSpecs.concat(ConfigParser.getFilePaths(suite, undefined, this._pathService))
                }
            }

            if (suiteSpecs.length === 0) {
                throw new Error(`The suite(s) "${suites.join('", "')}" you specified don't exist ` +
                    'in your config file or doesn\'t contain any files!')
            }

            // Allow --suite and --spec to both be defined on the command line
            // Removing any duplicate tests that could be included
            let tmpSpecs = spec.length > 0 ? [...specs, ...suiteSpecs] : suiteSpecs

            if (Array.isArray(capSpecs)) {
                tmpSpecs = ConfigParser.getFilePaths(capSpecs, undefined, this._pathService)
            }

            if (Array.isArray(capExclude)) {
                exclude = ConfigParser.getFilePaths(capExclude, undefined, this._pathService)
            }

            specs = [...new Set(tmpSpecs)]
            return this.filterSpecs(specs, <string[]> exclude)
        }

        if (Array.isArray(capSpecs)) {
            specs = ConfigParser.getFilePaths(capSpecs, undefined, this._pathService)
        }

        if (Array.isArray(capExclude)) {
            exclude = ConfigParser.getFilePaths(capExclude, undefined, this._pathService)
        }
        return this.filterSpecs(specs, <string[]> exclude)
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
    setFilePathToFilterOptions(cliArgFileList: string[], config: Spec[]) {
        const filesToFilter = new Set<string>()
        const fileList = ConfigParser.getFilePaths(config, undefined, this._pathService)
        cliArgFileList.forEach(filteredFile => {
            filteredFile = removeLineNumbers(filteredFile)
            // Send single file/file glob to getFilePaths - not supporting hierarchy in spec/exclude
            // Return value will alwyas be string[]
            let globMatchedFiles = <string[]>ConfigParser.getFilePaths(this._pathService.glob(filteredFile), undefined, this._pathService)
            if (this._pathService.isFile(filteredFile)) {
                filesToFilter.add(this._pathService.ensureAbsolutePath(filteredFile))
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
    getConfig() {
        return this._config as Required<Options.Testrunner>
    }

    /**
     * return capabilities
     */
    getCapabilities(i?: number) {
        if (typeof i === 'number' && Array.isArray(this._capabilities) && this._capabilities[i]) {
            return this._capabilities[i]
        }

        return this._capabilities
    }

    /**
     * returns a flattened list of globbed files
     *
     * @param  {String[] | String[][]} filenames list of files to glob
     * @param  {Boolean} flag to indicate omission of warnings
     * @param  {FileSystemPathService} file system path service for expanding globbed file names
     * @param  {number} hierarchy depth to prevent recursive calling beyond a depth of 1
     * @return {String[] | String[][]} list of files
     */
    static getFilePaths(patterns: Spec[], omitWarnings?: boolean, findAndGlob: PathService = new FileSystemPathService(), hierarchyDepth?: number) {
        let files: Spec[] = []
        let groupedFiles: string[] = []

        if (typeof patterns === 'string') {
            patterns = [patterns]
        }

        // patterns must be an array of strings and/or string arrays
        // check and throw and error if not
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
                groupedFiles = <string[]>ConfigParser.getFilePaths(pattern, omitWarnings, findAndGlob, 1)
                files.push(groupedFiles)
            } else if (Array.isArray(pattern) && hierarchyDepth) {
                log.error('Unexpected depth of hierarchical arrays')
            } else {
                pattern = pattern.toString().replace(/\\/g, '/')
                let filenames = findAndGlob.glob(<string>pattern)
                filenames = filenames.filter(
                    (filename) => SUPPORTED_FILE_EXTENSIONS.find(
                        (ext) => filename.endsWith(ext)))

                filenames = filenames.map(filename => findAndGlob.ensureAbsolutePath(filename))

                if (filenames.length === 0 && !omitWarnings) {
                    log.warn('pattern', pattern, 'did not match any file')
                }
                files = merge(files, filenames, MERGE_OPTIONS)
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
