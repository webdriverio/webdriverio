import path from 'path'
import glob from 'glob'
import merge from 'deepmerge'

import detectSeleniumBackend from '../helpers/detectSeleniumBackend'

const DEFAULT_TIMEOUT = 10000
const NOOP = function () {}
const DEFAULT_CONFIGS = {
    specs: [],
    exclude: [],
    logLevel: 'silent',
    coloredLogs: true,
    baseUrl: null,
    waitforTimeout: 1000,
    framework: 'mocha',
    reporter: 'dot',
    maxInstances: 1,

    /**
     * framework defaults
     */
    mochaOpts: {
        timeout: DEFAULT_TIMEOUT
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: DEFAULT_TIMEOUT
    },

    /**
     * hooks
     */
    onPrepare: NOOP,
    before: NOOP,
    beforeSuite: NOOP,
    beforeHook: NOOP,
    beforeTest: NOOP,
    beforeCommand: NOOP,
    afterCommand: NOOP,
    afterTest: NOOP,
    afterHook: NOOP,
    afterSuite: NOOP,
    after: NOOP,
    onComplete: NOOP
}

class ConfigParser {
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
            var fileConfig = require(filePath).config

            if (typeof fileConfig !== 'object') {
                throw new Error('configuration file exports no config object')
            }

            /**
             * merge capabilities
             */
            this._capabilities = merge(this._capabilities, fileConfig.capabilities)
            delete fileConfig.capabilities

            this._config = merge(this._config, fileConfig)

            /**
             * detect Selenium backend
             */
            this._config = merge(detectSeleniumBackend(this._config), this._config)
        } catch (e) {
            console.error('Failed loading configuration file: ', filePath)
            throw e
        }
    }

    /**
     * merge external object with config object
     * @param  {Object} object  desired object to merge into the config object
     */
    merge (object) {
        this._config = merge(this._config, object)

        /**
         * user and key could get added via cli arguments so we need to detect again
         * Note: cli arguments are on the right and overwrite config
         */
        this._config = merge(detectSeleniumBackend(this._config), this._config)
    }

    /**
     * get excluded files from config pattern
     */
    getSpecs (capSpecs, capExclude) {
        let specs = ConfigParser.getFilePaths(this._config.specs)
        let exclude = ConfigParser.getFilePaths(this._config.exclude)

        if (Array.isArray(capSpecs)) {
            specs = specs.concat(capSpecs)
        }
        if (Array.isArray(capExclude)) {
            exclude = exclude.concat(capExclude)
        }

        return specs.filter(spec => exclude.indexOf(spec) < 0)
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

        for (let pattern of patterns) {
            let filenames = glob.sync(pattern)

            filenames = filenames.filter(path =>
                path.slice(-3) === '.js' ||
                path.slice(-8) === '.feature' ||
                path.slice(-7) === '.coffee')

            filenames = filenames.map(path =>
                process.cwd() + '/' + path)

            if (filenames.length === 0 && !omitWarnings) {
                console.warn('pattern', pattern, 'did not match any file')
            }

            files = merge(files, filenames)
        }

        return files
    }
}

export default ConfigParser
