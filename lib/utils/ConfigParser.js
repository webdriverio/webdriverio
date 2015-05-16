var path = require('path'),
    glob = require('glob'),
    merge = require('deepmerge');

var ConfigParser = function() {
    this._config = {
        host: '0.0.0.0',
        port: 4444,
        specs: [],
        exclude: [],
        logLevel: 'silent',
        coloredLogs: true,
        screenshotPath: 'shots',
        waitforTimeout: 1000,
        framework: 'mocha',
        reporter: 'dot',
        mochaOpts: {
            timeout: 60000
        }
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
    } catch(e) {
        console.error('Failed loading configuration file: ', filePath);
        throw e;
    }

};

/**
 * returns a flatten list of globed files
 *
 * @param  {String[]} filenames  list of files to glob
 * @return {String[]} list of files
 */
ConfigParser.prototype.getFilePaths = function(patterns) {
    var files = [],
        pattern, filenames;

    for(var i = 0; i < patterns.length; ++i) {
        pattern = patterns[i];
        filenames = glob.sync(pattern);

        if(filenames.length === 0) {
            console.warn('pattern', filenames, 'did not match any file');
        }

        files = merge(files, filenames);
    }

    return files;
};

/**
 * get excluded files from config pattern
 */
ConfigParser.prototype.getSpecs = function() {
    var specs = this.getFilePaths(this._config.specs),
        exclude = this.getFilePaths(this._config.exclude);

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