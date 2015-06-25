'use strict';

var path = require('path'),
    fs = require('fs'),
    launcher = require('./launcher'),

    optimist = require('optimist').
    usage('WebdriverIO CLI runner\n\n' +
        'Usage: wdio [options] [configFile]\n' +
        'config file defaults to wdio.conf.js\n' +
        'The [options] object will override values from the config file.').

    describe('help', 'prints WebdriverIO help menu').
    alias('help', 'h').
    describe('version', 'prints WebdriverIO version').
    alias('version', 'v').
    describe('host', 'selenium server host address').
    describe('port', 'selenium server port').
    describe('user', 'username if using a cloud service as Selenium backend').
    alias('user', 'u').
    describe('key', 'corresponding access key to the user').
    alias('key', 'k').
    describe('updateJob', 'if true update job properties for Sauce Labs job (default: true)').
    describe('logLevel', 'level of logging verbosity (default: silent)').
    alias('logLevel', 'l').
    describe('coloredLogs', 'if true enables colors for log output (default: true)').
    alias('coloredLogs', 'c').
    describe('screenshotPath', 'saves a screenshot to a given path if a command failes').
    alias('screenshotPath', 's').
    describe('baseUrl', 'shorten url command calls by setting a base url').
    alias('baseUrl', 'b').
    describe('waitforTimeout', 'timeout for all waitForXXX commands (default: 500ms)').
    alias('waitforTimeout', 'w').
    describe('framework', 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)').
    alias('framework', 'f').
    describe('reporter', 'reporter to print out the results on stdout').
    alias('reporter', 'r').

    describe('waitforTimeout', 'Default timeout for all wait commands').
    describe('logLevel', 'Level of test output verbosity').

    check(function(arg) {
      if (arg._.length > 1) {
        throw 'Error: more than one config file specified';
      }
    });

var argv = optimist.parse(process.argv.slice(2));

if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}

if (argv.version) {
    console.log('Version ' + require(path.join(__dirname, '../package.json')).version);
    process.exit(0);
}

// Use default configuration, if it exists.
var configFile = argv._[0];
if (!configFile) {
    if (fs.existsSync('./wdio.conf.js')) {
        configFile = './wdio.conf.js';
    }
}

var args = {},
    allowedArgv = ['host', 'port', 'user', 'key', 'updateJob', 'logLevel', 'coloredLogs', 'screenshotPath',
                   'baseUrl', 'waitforTimeout', 'framework', 'reporter'];

allowedArgv.forEach(function(key) {
    if(argv[key]) {
        args[key] = argv[key];
    }
});

launcher.init(configFile, args);