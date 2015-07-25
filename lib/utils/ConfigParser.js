var path = require('path'),
    glob = require('glob'),
    merge = require('deepmerge'),
    detectSeleniumBackend = require('../helpers/detectSeleniumBackend');

var ConfigParser = function() {
    var noop = function() {};

    this._config = {
        specs: [],
        exclude: [],
        logLevel: 'silent',
        coloredLogs: true,
        baseUrl: null,
        waitforTimeout: 1000,
        framework: 'mocha',
        reporter: 'dot',
        mochaOpts: {
            timeout: 10000
        },
        updateJob: true,
        onPrepare: noop,
        before: noop,
        after: noop,
        onComplete: noop
    };

    this._capabilities = [];
};

/**
 * merges config file with default values
 * @param {String} filename path of file relative to current directory
 */
ConfigParser.prototype.addConfigFile = function(filename) {

    if(typeof filename !== 'string') {
        throw new Error('addConfigFile requires filepath');
    }

    var filePath = path.resolve(process.cwd(), filename);

    try {
        var fileConfig = require(filePath).config;

        if(typeof fileConfig !== 'object') {
            throw new Error('configuration file exports no config object');
        }

        /**
         * merge capabilities
         */
        this._capabilities = merge(this._capabilities, fileConfig.capabilities);
        delete fileConfig.capabilities;

        this._config = merge(this._config, fileConfig);

        /**
         * detect Selenium backend
         */
        this._config = merge(detectSeleniumBackend(this._config), this._config);

    } catch(e) {
        console.error('Failed loading configuration file: ', filePath);
        throw e;
    }

};

/**
 * merge external object with config object
 * @param  {Object} object  desired object to merge into the config object
 */
ConfigParser.prototype.merge = function(object) {
    this._config = merge(this._config, object);
};

/**
 * returns a flatten list of globed files
 *
 * @param  {String[]} filenames  list of files to glob
 * @return {String[]} list of files
 */
var getFilePaths = ConfigParser.prototype.getFilePaths = function(patterns, omitWarnings) {
    var files = [],
        pattern, filenames,
        patternMap = function(path) { return process.cwd() + '/' + path; },
        patternFilter = function(path) { return path.slice(-3) === '.js' || path.slice(-7) === 'feature'; };

    for(var i = 0; i < patterns.length; ++i) {
        pattern = patterns[i];
        filenames = glob.sync(pattern);
        filenames = filenames.filter(patternFilter);
        filenames = filenames.map(patternMap);

        if(filenames.length === 0 && !omitWarnings) {
            console.warn('pattern', pattern, 'did not match any file');
        }

        files = merge(files, filenames);
    }

    return files;
};

/**
 * get excluded files from config pattern
 */
ConfigParser.prototype.getSpecs = function(capSpecs, capExclude) {
    var specs = this.getFilePaths(this._config.specs),
        exclude = this.getFilePaths(this._config.exclude);

    if(Array.isArray(capSpecs)) {
        specs = specs.concat(capSpecs);
    }
    if(Array.isArray(capExclude)) {
        exclude = exclude.concat(capExclude);
    }

    return specs.filter(function(spec) {
        return exclude.indexOf(spec) < 0;
    });
};

/**
 * return configs
 */
ConfigParser.prototype.getConfig = function() {
    return this._config;
};

/**
 * return capabilities
 */
ConfigParser.prototype.getCapabilities = function() {
    return this._capabilities;
};

module.exports = ConfigParser;
module.exports.getFilePaths = getFilePaths;