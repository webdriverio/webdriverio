import fs from 'fs'
import path from 'path'
import glob from 'glob'
import merge from 'deepmerge'

import logger from 'wdio-logger'

import { detectBackend } from '../utils'

import { DEFAULT_CONFIGS, SUPPORTED_HOOKS } from '../constants'

const log = logger('wdio-config:ConfigParser')
const MERGE_OPTIONS = { clone: false }

export default class ConfigParser {
    constructor () {
        this._config = DEFAULT_CONFIGS
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

        var filePath = path.resolve(process.cwd(), filename)

        try {
            /**
             * clone the original config
             */
            var fileConfig = merge(require(filePath).config, {}, MERGE_OPTIONS)

            /**
             * merge capabilities
             */
            const defaultTo = Array.isArray(this._capabilities) ? [] : {}
            this._capabilities = merge(this._capabilities, fileConfig.capabilities || defaultTo, MERGE_OPTIONS)
            delete fileConfig.capabilities

            /**
             * add service hooks and remove them from config
             */
            this.addService(fileConfig)
            for (let hookName of SUPPORTED_HOOKS) {
                delete fileConfig[hookName]
            }

            this._config = merge(this._config, fileConfig, MERGE_OPTIONS)

            /**
             * detect Selenium backend
             */
            this._config = merge(detectBackend(this._config), this._config, MERGE_OPTIONS)
        } catch (e) {
            log.error(`Failed loading configuration file: ${filePath}`)
            throw e
        }
    }

    /**
     * merge external object with config object
     * @param  {Object} object  desired object to merge into the config object
     */
    merge (object = {}) {
        this._config = merge(this._config, object, MERGE_OPTIONS)
        let spec = Array.isArray(object.spec) ? object.spec : []
        let exclude = Array.isArray(object.exclude) ? object.exclude : []

        /**
         * overwrite config specs that got piped into the wdio command
         */
        if (object.specs && object.specs.length > 0) {
            this._config.specs = object.specs
        } else if (object.exclude && object.exclude.length > 0) {
            this._config.exclude = object.exclude
        }

        /**
         * merge capabilities
         */
        const defaultTo = Array.isArray(this._capabilities) ? [] : {}
        this._capabilities = merge(this._capabilities, this._config.capabilities || defaultTo, MERGE_OPTIONS)

        /**
         * run single spec file only, regardless of multiple-spec specification
         */
        this.setFilePathToFilterOptions(spec)
        this.setFilePathToFilterOptions(exclude, true)

        /**
         * user and key could get added via cli arguments so we need to detect again
         * Note: cli arguments are on the right and overwrite config
         * if host and port are default, remove them to get new values
         */
        let defaultBackend = detectBackend({})
        if (this._config.hostname === defaultBackend.hostname && this._config.port === defaultBackend.port) {
            delete this._config.hostname
            delete this._config.port
        }

        this._config = merge(detectBackend(this._config), this._config, MERGE_OPTIONS)
    }

    /**
     * add hooks from services to runner config
     * @param {Object} service  a service is basically an object that contains hook methods
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
                // ToDo: log warning if suite was not found
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
            const tmp_specs = spec.length > 0 ? [...specs, ...suiteSpecs] : suiteSpecs

            return [...new Set(tmp_specs)]
        }

        if (Array.isArray(capSpecs)) {
            specs = specs.concat(ConfigParser.getFilePaths(capSpecs))
        }

        if (Array.isArray(capExclude)) {
            exclude = exclude.concat(ConfigParser.getFilePaths(capExclude))
        }

        return specs.filter(spec => exclude.indexOf(spec) < 0)
    }

    /**
     * sets config attribute with file paths from filtering
     * options from cli argument
     *
     * @param  {String} filterObj  list of files in a string from
     * cli argument
     * @return {Boolean} exclude  true or false
     */
    setFilePathToFilterOptions (filterObj, exclude = false) {
        const FILTER_TYPE = exclude ? 'exclude' : 'specs'
        if (filterObj.length > 0) {
            const objs = new Set()
            const objsList = ConfigParser.getFilePaths(this._config[FILTER_TYPE])
            filterObj.forEach(filtered_file => {
                if (fs.existsSync(filtered_file) && fs.lstatSync(filtered_file).isFile()) {
                    objs.add(path.resolve(process.cwd(), filtered_file))
                }
                else {
                    objsList.forEach(file => {
                        if (file.match(filtered_file)) {
                            objs.add(file)
                        }
                    })
                }
            })
            if (objs.size === 0) {
                throw new Error(`spec file(s) ${filterObj.join(`, `)} not found`)
            }
            this._config[FILTER_TYPE] = [...objs]
        }
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
            patterns = [patterns]
        }

        if (!Array.isArray(patterns)) {
            throw new Error('specs or exclude property should be an array of strings')
        }

        for (let pattern of patterns) {
            let filenames = glob.sync(pattern)

            filenames = filenames.filter(filename =>
                filename.slice(-3) === '.js' ||
                filename.slice(-3) === '.ts' ||
                filename.slice(-8) === '.feature' ||
                filename.slice(-7) === '.coffee')

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
