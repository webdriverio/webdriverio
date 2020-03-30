import fs from 'fs'
import path from 'path'
import glob from 'glob'
import merge from 'deepmerge'

import logger from '@wdio/logger'

import { detectBackend, removeLineNumbers, isCucumberFeatureWithLineNumber, validObjectOrArray } from '../utils'

import { DEFAULT_CONFIGS, SUPPORTED_HOOKS, SUPPORTED_FILE_EXTENSIONS } from '../constants'

const log = logger('@wdio/config:ConfigParser')
const MERGE_OPTIONS = { clone: false }

export default class ConfigParser {
    constructor () {
        this._config = DEFAULT_CONFIGS()

        this._capabilities = []
    }

    /**
     * merges config file with default values
     * @param {String} filename path of file relative to current directory
     */
    addConfigFile (filename) {
        if (typeof filename !== 'string') {
            throw new Error('addConfigFile requires filepath')
        }

        const filePath = path.resolve(process.cwd(), filename)

        try {
            /**
             * clone the original config
             */
            const fileConfig = merge(require(filePath).config, {}, MERGE_OPTIONS)

            /**
             * merge capabilities
             */
            const defaultTo = Array.isArray(this._capabilities) ? [] : {}
            this._capabilities = merge(this._capabilities, fileConfig.capabilities || defaultTo, MERGE_OPTIONS)
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
             * For Sauce Labs RDC we need to determine if the config file has a `testobject_api_key`
             * If so, we need to provide a boolean to the `detectBackend` to set the correct hostname
             *
             * NOTE: This will not work for multi remote
             */
            const isRDC = Array.isArray(this._capabilities) && this._capabilities.some(capability => 'testobject_api_key' in capability)

            /**
             * detect Selenium backend
             */
            this._config = merge(detectBackend(this._config, isRDC), this._config, MERGE_OPTIONS)

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
    merge (object = {}) {
        const spec = Array.isArray(object.spec) ? object.spec : []
        const exclude = Array.isArray(object.exclude) ? object.exclude : []

        this._config = merge(this._config, object, MERGE_OPTIONS)
        /**
         * overwrite config specs that got piped into the wdio command
         */
        if (object.specs && object.specs.length > 0) {
            this._config.specs = object.specs
        } else if (object.exclude && object.exclude.length > 0) {
            this._config.exclude = object.exclude
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
            this._config.specs = [...this.setFilePathToFilterOptions(spec, this._config.specs)]
        }
        if (exclude.length > 0) {
            this._config.exclude = [...this.setFilePathToFilterOptions(exclude, this._config.exclude)]
        }

        /**
         * user and key could get added via cli arguments so we need to detect again
         * Note: cli arguments are on the right and overwrite config
         * if host and port are default, remove them to get new values
         */
        let defaultBackend = detectBackend({})
        if (
            (this._config.protocol === defaultBackend.protocol) &&
            (this._config.hostname === defaultBackend.hostname) &&
            (this._config.port === defaultBackend.port) &&
            (this._config.path === defaultBackend.path)
        ) {
            delete this._config.protocol
            delete this._config.hostname
            delete this._config.port
            delete this._config.path
        }

        this._config = merge(detectBackend(this._config), this._config, MERGE_OPTIONS)
    }

    /**
     * Add hooks from an existing service to the runner config.
     * @param {Object} service - an object that contains hook methods.
     */
    addService (service) {
        for (let hookName of SUPPORTED_HOOKS) {
            if (!service[hookName]) {
                continue
            }

            if (typeof service[hookName] === 'function') {
                this._config[hookName].push(service[hookName].bind(service))
            } else if (Array.isArray(service[hookName])) {
                for (let hook of service[hookName]) {
                    if (typeof hook === 'function') {
                        this._config[hookName].push(hook.bind(service))
                    }
                }
            }
        }
    }

    /**
     * get excluded files from config pattern
     */
    getSpecs (capSpecs, capExclude) {
        let specs = ConfigParser.getFilePaths(this._config.specs)
        let spec  = Array.isArray(this._config.spec) ? this._config.spec : []
        let exclude = ConfigParser.getFilePaths(this._config.exclude)
        let suites = Array.isArray(this._config.suite) ? this._config.suite : []

        /**
         * check if user has specified a specific suites to run
         */
        if (suites.length > 0) {
            let suiteSpecs = []
            for (let suiteName of suites) {
                // TODO: log warning if suite was not found
                let suite = this._config.suites[suiteName]

                if (suite && Array.isArray(suite)) {
                    suiteSpecs = suiteSpecs.concat(ConfigParser.getFilePaths(suite))
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
                tmpSpecs = ConfigParser.getFilePaths(capSpecs)
            }

            if (Array.isArray(capExclude)) {
                exclude = ConfigParser.getFilePaths(capExclude)
            }

            specs = [...new Set(tmpSpecs)]
            return specs.filter(spec => !exclude.includes(spec))
        }

        if (Array.isArray(capSpecs)) {
            specs = ConfigParser.getFilePaths(capSpecs)
        }

        if (Array.isArray(capExclude)) {
            exclude = ConfigParser.getFilePaths(capExclude)
        }

        return specs.filter(spec => !exclude.includes(spec))
    }

    /**
     * sets config attribute with file paths from filtering
     * options from cli argument
     *
     * @param  {String} cliArgFileList  list of files in a string from
     * @param  {Object} config  config object that stores the spec and exclude attributes
     * cli argument
     * @return {String[]} List of files that should be included or excluded
     */
    setFilePathToFilterOptions (cliArgFileList, config) {
        const filesToFilter = new Set()
        const fileList = ConfigParser.getFilePaths(config)
        cliArgFileList.forEach(filteredFile => {
            filteredFile = removeLineNumbers(filteredFile)
            let globMatchedFiles = ConfigParser.getFilePaths(glob.sync(filteredFile))
            if (fs.existsSync(filteredFile) && fs.lstatSync(filteredFile).isFile()) {
                filesToFilter.add(path.resolve(process.cwd(), filteredFile))
            } else if (globMatchedFiles.length) {
                globMatchedFiles.forEach(file => filesToFilter.add(file))
            } else {
                fileList.forEach(file => {
                    if (file.match(filteredFile)) {
                        filesToFilter.add(file)
                    }
                })
            }
        })
        if (filesToFilter.size === 0) {
            throw new Error(`spec file(s) ${cliArgFileList.join(', ')} not found`)
        }
        return filesToFilter
    }

    /**
     * return configs
     */
    getConfig () {
        return this._config
    }

    /**
     * return capabilities
     */
    getCapabilities (i) {
        if (typeof i === 'number' && this._capabilities[i]) {
            return this._capabilities[i]
        }

        return this._capabilities
    }

    /**
     * returns a flatten list of globed files
     *
     * @param  {String[]} filenames  list of files to glob
     * @return {String[]} list of files
     */
    static getFilePaths (patterns, omitWarnings) {
        let files = []

        if (typeof patterns === 'string') {
            patterns = removeLineNumbers(patterns)
            patterns = [patterns]
        } else {
            patterns = patterns.map(pattern => removeLineNumbers(pattern))
        }

        if (!Array.isArray(patterns)) {
            throw new Error('specs or exclude property should be an array of strings')
        }

        for (let pattern of patterns) {
            let filenames = glob.sync(pattern)

            filenames = filenames.filter(
                (filename) => SUPPORTED_FILE_EXTENSIONS.find(
                    (ext) => filename.endsWith(ext)))

            filenames = filenames.map(filename =>
                path.isAbsolute(filename) ? path.normalize(filename) : path.resolve(process.cwd(), filename))

            if (filenames.length === 0 && !omitWarnings) {
                log.warn('pattern', pattern, 'did not match any file')
            }

            files = merge(files, filenames, MERGE_OPTIONS)
        }

        return files
    }
}
