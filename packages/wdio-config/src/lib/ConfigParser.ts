import merge from 'deepmerge'
import logger from '@wdio/logger'
import type { Capabilities, Options, Services } from '@wdio/types'

import {
    removeLineNumbers, isCucumberFeatureWithLineNumber, validObjectOrArray,
    loadAutoCompilers, ModuleRequireService
} from '../utils'
import {
    SUPPORTED_HOOKS,
    SUPPORTED_FILE_EXTENSIONS
} from '../constants'
import {
    DEFAULT_CONFIGS
} from '../'
import FileSystemPathService from './FileSystemPathService'
import RequireLibrary from './RequireLibrary'
const log = logger('@wdio/config:ConfigParser')
const MERGE_OPTIONS = { clone: false }

interface TestrunnerOptionsWithParameters extends Omit<Options.Testrunner, 'capabilities'> {
    watch?: boolean
    spec?: string[]
    suite?: string[]
    capabilities?: Capabilities.RemoteCapabilities
}

interface MergeConfig extends Omit<Partial<TestrunnerOptionsWithParameters>, 'specs' | 'exclude'> {
    specs?: string | string[]
    exclude?: string | string[]
}

// Get current working directory
interface CurrentPathFinder {
    getcwd(): string
}

// Require a .js/.json/dotfile config file
interface LoadConfigFile {
    loadFile<T>(path: string): T
}

// Detect if a file is present
interface IsFileDetector {
    isFile(path: string): boolean
}

interface DeterminesAbsolutePath {
    ensureAbsolutePath(path: string): string
}

// Glob to find file paths matching a pattern
interface Globber {
    glob(pattern: string): string[];
}

export interface PathService extends CurrentPathFinder, LoadConfigFile, IsFileDetector, Globber, DeterminesAbsolutePath {}

export default class ConfigParser {
    private _config: TestrunnerOptionsWithParameters = DEFAULT_CONFIGS()
    private _capabilities: Capabilities.RemoteCapabilities = [];
    private _pathService: PathService;
    private _moduleRequireService: ModuleRequireService;

    constructor(pathService: PathService = new FileSystemPathService(), moduleRequireService:ModuleRequireService = new RequireLibrary()) {
        this._pathService = pathService
        this._moduleRequireService = moduleRequireService
    }

    autoCompile() {
        /**
         * on launcher compile files if Babel or TypeScript are installed using our defaults
         */
        if (this._config.autoCompileOpts && !loadAutoCompilers(this._config.autoCompileOpts!, this._moduleRequireService)) {
            log.debug('No compiler found, continue without compiling files')
        }
    }

    /**
     * merges config file with default values
     * @param {String} filename path of file relative to current directory
     */
    addConfigFile (filename: string) {
        if (typeof filename !== 'string') {
            throw new Error('addConfigFile requires filepath')
        }

        const filePath = this._pathService.ensureAbsolutePath(filename)

        try {
            const config = this._pathService.loadFile<{config: TestrunnerOptionsWithParameters}>(filePath).config

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
        } catch (e) {
            log.error(`Failed loading configuration file: ${filePath}:`, e.message)
            throw e
        }
    }

    /**
     * merge external object with config object
     * @param  {Object} object  desired object to merge into the config object
     */
    merge (object: MergeConfig = {}) {
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
    addService (service: Services.Hooks) {
        const addHook = <T extends keyof Services.Hooks>(hookName: T, hook: Extract<Services.Hooks[T], Function>) => {
            const existingHooks: Options.Testrunner[keyof Services.Hooks] = this._config[hookName]
            if (!existingHooks) {
                // @ts-ignore Expression produces a union type that is too complex to represent
                this._config[hookName] = hook.bind(service)
            } else if (typeof existingHooks === 'function') {
                this._config[hookName] = [existingHooks, hook.bind(service)]
            } else {
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
    getSpecs (capSpecs?: string[], capExclude?: string[]) {
        let specs = ConfigParser.getFilePaths(this._config.specs!, undefined, this._pathService)
        let spec  = Array.isArray(this._config.spec) ? this._config.spec : []
        let exclude = ConfigParser.getFilePaths(this._config.exclude!, undefined, this._pathService)
        let suites = Array.isArray(this._config.suite) ? this._config.suite : []

        /**
         * check if user has specified a specific suites to run
         */
        if (suites.length > 0) {
            let suiteSpecs: string[] = []
            for (let suiteName of suites) {
                let suite = this._config.suites?.[suiteName]
                if (!suite) {
                    log.warn(`No suite was found with name "${suiteName}"`)
                }
                if (Array.isArray(suite)) {
                    // Not supporting hierarchical suites - return will always be string[]
                    suiteSpecs = suiteSpecs.concat(<string[]> ConfigParser.getFilePaths(suite, undefined, this._pathService))
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
            return specs.filter(spec => !exclude.includes(spec))
        }

        if (Array.isArray(capSpecs)) {
            specs = ConfigParser.getFilePaths(capSpecs, undefined, this._pathService)
        }

        if (Array.isArray(capExclude)) {
            exclude = ConfigParser.getFilePaths(capExclude, undefined, this._pathService)
        }
        return specs.filter(spec => !exclude.includes(spec))
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
    setFilePathToFilterOptions (cliArgFileList: string[], config: string[]) {
        const filesToFilter = new Set<string>()
        const fileList = ConfigParser.getFilePaths(config, undefined, this._pathService)
        cliArgFileList.forEach(filteredFile => {
            filteredFile = removeLineNumbers(filteredFile)
            // Send single file/file glob to getFilePaths - not supporting hierarchy in spec/exclude
            // Return value will alwyas be string[]
            let globMatchedFiles = <string[]> ConfigParser.getFilePaths(this._pathService.glob(filteredFile), undefined, this._pathService)
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
                    } else if (Array.isArray(file)){
                        file.forEach(subFile => {
                            if (subFile.match(filteredFile)) {
                                filesToFilter.add(subFile)
                            }
                        })
                    }
                    log.warn('Unexpected entry in specs that is neither string nor array: ', file)
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
        return this._config as Required<Options.Testrunner>
    }

    /**
     * return capabilities
     */
    getCapabilities (i?: number) {
        if (typeof i === 'number' && Array.isArray(this._capabilities) && this._capabilities[i]) {
            return this._capabilities[i]
        }

        return this._capabilities
    }

    /**
     * returns a flatten list of globed files
     *
     * @param  {String[] | String[][]} filenames list of files to glob
     * @param  {Boolean} flag to indicate omission of warnings
     * @param  {FileSystemPathService} file system path service for expanding globbed file names
     * @param  {number} hierarchy depth to prevent recursive calling beyond a depth of 1
     * @return {String[] | String[][]} list of files
     */
    static getFilePaths (patterns: (string | string[])[], omitWarnings?: boolean, findAndGlob: CurrentPathFinder & Globber & DeterminesAbsolutePath = new FileSystemPathService(), hierarchyDepth?: number) {
        let files: (string | string[])[] = []
        let groupedFiles: string[] = []
        let depth: number = hierarchyDepth || 0

        if (typeof patterns === 'string') {
            patterns = [patterns]
        }

        // Check we have an array
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
            if (Array.isArray(pattern) && depth === 0) {
                // Will always only get a string array back
                groupedFiles = <string[]> ConfigParser.getFilePaths(pattern, omitWarnings, findAndGlob, 1)
                files.push(groupedFiles)
            } else {
                let filenames = findAndGlob.glob(<string> pattern)
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
}
