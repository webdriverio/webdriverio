'use strict';

var path = require('path'),
    fs = require('fs'),
    ejs = require('ejs'),
    inquirer = require('inquirer'),
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
    describe('host', 'Selenium server host address').
    describe('port', 'Selenium server port').
    describe('path', 'Selenium server path (default: /wd/hub)').
    describe('user', 'username if using a cloud service as Selenium backend').
    alias('user', 'u').
    describe('key', 'corresponding access key to the user').
    alias('key', 'k').
    describe('updateJob', 'if true update job properties for Sauce Labs job (default: true)').
    describe('logLevel', 'level of logging verbosity (default: silent)').
    alias('logLevel', 'l').
    describe('coloredLogs', 'if true enables colors for log output (default: true)').
    alias('coloredLogs', 'c').
    describe('screenshotPath', 'saves a screenshot to a given path if a command fails').
    alias('screenshotPath', 's').
    describe('baseUrl', 'shorten url command calls by setting a base url').
    alias('baseUrl', 'b').
    describe('waitforTimeout', 'timeout for all waitForXXX commands (default: 500ms)').
    alias('waitforTimeout', 'w').
    describe('framework', 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)').
    alias('framework', 'f').
    describe('reporter', 'reporter to print out the results on stdout').
    alias('reporter', 'r').
    describe('cucumberOpts.tags', 'run only certain scenarios annotated by tags').
    describe('cucumberOpts.ignoreUndefinedDefinitions', 'ignore undefined step definitions').
    describe('cucumberOpts.require', 'specify where your step definitions are located').
    describe('jasmineOpts.defaultTimeoutInterval', 'Jasmine default timeout').
    describe('mochaOpts.ui', 'specify user-interface').
    describe('mochaOpts.timeout', 'set test-case timeout in milliseconds').
    describe('mochaOpts.require', 'require the given module').
    describe('mochaOpts.compilers', 'use the given module(s) to compile files').

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

if(argv._[0] === 'config') {
    console.log('\n=========================');
    console.log('WDIO Configuration Helper');
    console.log('=========================\n');
    return inquirer.prompt([{
        type: 'list',
        name: 'backend',
        message: 'Where do you want to execute your tests?',
        choices: [
          'On my local machine',
          'In the cloud using Sauce Labs, Browsertack or Testingbot',
          'In the cloud using a different service',
          'I have my own Selenium cloud'
        ]
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the host address of that cloud service?',
        when: function(answers) {
            return answers.backend.indexOf('different service') > -1;
        }
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port on which that service is running?',
        default: '80',
        when: function(answers) {
            return answers.backend.indexOf('different service') > -1;
        }
    }, {
        type: 'input',
        name: 'env_user',
        message: 'Environment variable for username',
        default: 'SAUCE_USERNAME',
        when: function(answers) { return answers.backend.indexOf('In the cloud') > -1; }
    }, {
        type: 'input',
        name: 'env_key',
        message: 'Environment variable for access key',
        default: 'SAUCE_ACCESS_KEY',
        when: function(answers) { return answers.backend.indexOf('In the cloud') > -1; }
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the IP or URI to your Selenium standalone server?',
        default: '0.0.0.0',
        when: function(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port which your Selenium standalone server is running on?',
        default: '4444',
        when: function(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'path',
        message: 'What is the path to your Selenium standalone server?',
        default: '/wd/hub',
        when: function(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'list',
        name: 'framework',
        message: 'Which framework do you want to use?',
        choices: [
          'mocha',
          'jasmine',
          'cucumber'
        ]
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your test specs located?',
        default: './test/specs/**/*.js',
        when: function(answers) {
            return answers.framework.match(/(mocha|jasmine)/);
        }
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your feature files located?',
        default: './features/**/*.feature',
        when: function(answers) {
            return answers.framework === 'cucumber';
        }
    }, {
        type: 'input',
        name: 'stepDefinitions',
        message: 'Where are your step definitions located?',
        default: './features/step-definitions/**/*.js',
        when: function(answers) {
            return answers.framework === 'cucumber';
        }
    }, {
        type: 'list',
        name: 'reporter',
        message: 'Which reporter do you want to use? (see http://webdriver.io/guide/testrunner/reporters.html)',
        choices: [
          'dot',
          'spec',
          'xunit'
        ]
    }, {
        type: 'input',
        name: 'outputDir',
        message: 'In which directory should the xunit reports get stored?',
        default: './',
        when: function(answers) {
            return answers.reporter === 'xunit';
        }
    },{
        type: 'list',
        name: 'logLevel',
        message: 'Level of logging verbosity',
        default: 'silent',
        choices: [
          'silent',
          'verbose',
          'command',
          'data',
          'result',
          'error'
        ]
    }, {
        type: 'input',
        name: 'screenshotPath',
        message: 'In which directory should screenshots gets saved if a command fails?',
        default: './errorShots/'
    }, {
        type: 'input',
        name: 'baseUrl',
        message: 'What is the base url?',
        default: 'http://localhost',
    }], function(answers) {
        var tpl = fs.readFileSync(__dirname + '/helpers/wdio.conf.ejs', 'utf8');
        var renderedTpl = ejs.render(tpl, {
            answers: answers
        });

        fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl);
        console.log('\nConfiguration file was created successfully!');
        console.log('To run your tests, execute:\n\n\t$ wdio wdio.conf.js\n');
        process.exit(0);
    });
}

/**
 * sanitize cucumberOpts
 */
if(argv.cucumberOpts) {
    if(argv.cucumberOpts.tags) {
        argv.cucumberOpts.tags = argv.cucumberOpts.tags.split(',');
    }
    if(argv.cucumberOpts.ignoreUndefinedDefinitions) {
        argv.cucumberOpts.ignoreUndefinedDefinitions = argv.cucumberOpts.ignoreUndefinedDefinitions === 'true';
    }
    if(argv.cucumberOpts.require) {
        argv.cucumberOpts.require = argv.cucumberOpts.require.split(',');
    }
}

/**
 * sanitize jasmineOpts
 */
if(argv.jasmineOpts && argv.jasmineOpts.defaultTimeoutInterval) {
    argv.jasmineOpts.defaultTimeoutInterval = parseInt(argv.jasmineOpts.defaultTimeoutInterval, 10);
}

/**
 * sanitize mochaOpts
 */
if(argv.mochaOpts) {
    if(argv.mochaOpts.timeout) {
        argv.mochaOpts.timeout = parseInt(argv.mochaOpts.timeout, 10);
    }
    if(argv.mochaOpts.compilers) {
        argv.mochaOpts.compilers = argv.mochaOpts.compilers.split(',');
    }
    if(argv.mochaOpts.require) {
        argv.mochaOpts.require = argv.mochaOpts.require.split(',');
    }
}

// Use default configuration, if it exists.
var configFile = argv._[0];
if (!configFile) {
    if (fs.existsSync('./wdio.conf.js')) {
        configFile = './wdio.conf.js';
    }
}

var args = {},
    allowedArgv = ['host', 'port', 'path', 'user', 'key', 'updateJob', 'logLevel', 'coloredLogs', 'screenshotPath',
                   'baseUrl', 'waitforTimeout', 'framework', 'reporter', 'cucumberOpts', 'jasmineOpts', 'mochaOpts',
                   'connectionRetryTimeout', 'connectionRetryCount'];

allowedArgv.forEach(function(key) {
    if(argv[key]) {
        args[key] = argv[key];
    }
});

launcher.init(configFile, args);
