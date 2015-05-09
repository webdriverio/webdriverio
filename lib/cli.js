'use strict';

var path = require('path'),
    fs = require('fs'),
    launcher = require('./launcher'),

    optimist = require('optimist').
    usage('Usage: wdio [options] [configFile]\n' +
        'config file defaults to wdio.conf.js\n' +
        'The [options] object will override values from the config file.').

    describe('help', 'Print WebdriverIO menu').
    describe('version', 'Print WebdriverIO version').
    describe('host', 'Selenium server host address').
    describe('port', 'Selenium server port').
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

launcher.init(configFile, argv);