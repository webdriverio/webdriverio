'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _npmInstallPackage = require('npm-install-package');

var _npmInstallPackage2 = _interopRequireDefault(_npmInstallPackage);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _optimist = require('optimist');

var _optimist2 = _interopRequireDefault(_optimist);

var _launcher = require('./launcher');

var _launcher2 = _interopRequireDefault(_launcher);

var _packageJson = require('../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

/**
 * 💌 Dear contributors 💌
 * ========================================================================
 * If you are awesome and have created a new reporter, service or framework
 * adaption feel free to add it to this list and make a PR so people know
 * that your add-on is available and supported. Thanks, you 🚀!
 * ========================================================================
 */
var SUPPORTED_FRAMEWORKS = ['mocha', // https://github.com/webdriverio/wdio-mocha-framework
'jasmine', // https://github.com/webdriverio/wdio-jasmine-framework
'cucumber' // https://github.com/webdriverio/wdio-cucumber-framework
];
var SUPPORTED_REPORTER = [' dot - https://github.com/webdriverio/wdio-dot-reporter', ' junit - https://github.com/webdriverio/wdio-junit-reporter', ' allure - https://github.com/webdriverio/wdio-allure-reporter'];
var SUPPORTED_SERVICES = [' sauce - https://github.com/webdriverio/wdio-sauce-service'];

var VERSION = _packageJson2['default'].version;
var ALLOWED_ARGV = ['host', 'port', 'path', 'user', 'key', 'logLevel', 'coloredLogs', 'screenshotPath', 'baseUrl', 'waitforTimeout', 'framework', 'reporters', 'suite', 'cucumberOpts', 'jasmineOpts', 'mochaOpts', 'connectionRetryTimeout', 'connectionRetryCount'];

_optimist2['default'].usage('WebdriverIO CLI runner\n\n' + 'Usage: wdio [options] [configFile]\n' + 'config file defaults to wdio.conf.js\n' + 'The [options] object will override values from the config file.').describe('help', 'prints WebdriverIO help menu').alias('help', 'h').describe('version', 'prints WebdriverIO version').alias('version', 'v').describe('host', 'Selenium server host address').describe('port', 'Selenium server port').describe('path', 'Selenium server path (default: /wd/hub)').describe('user', 'username if using a cloud service as Selenium backend').alias('user', 'u').describe('key', 'corresponding access key to the user').alias('key', 'k').describe('logLevel', 'level of logging verbosity (default: silent)').alias('logLevel', 'l').describe('coloredLogs', 'if true enables colors for log output (default: true)').alias('coloredLogs', 'c').describe('screenshotPath', 'saves a screenshot to a given path if a command fails').alias('screenshotPath', 's').describe('baseUrl', 'shorten url command calls by setting a base url').alias('baseUrl', 'b').describe('waitforTimeout', 'timeout for all waitForXXX commands (default: 500ms)').alias('waitforTimeout', 'w').describe('framework', 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)').alias('framework', 'f').describe('reporters', 'reporter to print out the results on stdout').alias('reporters', 'r').describe('suite', 'overwrites the specs attribute and runs the defined suite').describe('cucumberOpts.*', 'Cucumber options, see the full list options at https://github.com/webdriverio/wdio-cucumber-framework#cucumberopts-options').describe('jasmineOpts.*', 'Jasmine options, see the full list options at https://github.com/webdriverio/wdio-jasmine-framework#jasminenodeopts-options').describe('mochaOpts.*', 'Mocha options, see the full list options at http://mochajs.org').check(function (arg) {
    if (arg._.length > 1) {
        throw new Error('Error: more than one config file specified');
    }
});

var argv = _optimist2['default'].parse(process.argv.slice(2));

if (argv.help) {
    _optimist2['default'].showHelp();
    process.exit(0);
}

if (argv.version) {
    console.log('v' + VERSION);
    process.exit(0);
}

/**
 * use wdio.conf.js default file name if no config was specified
 * otherwise run config sequenz
 */
var configFile = argv._[0];
if (!configFile) {
    if (_fs2['default'].existsSync('./wdio.conf.js')) {
        configFile = './wdio.conf.js';
    } else {
        argv._[0] = 'config';
    }
}

var configMode = false;
if (argv._[0] === 'config') {
    configMode = true;
    console.log('\n=========================\nWDIO Configuration Helper\n=========================\n');
    _inquirer2['default'].prompt([{
        type: 'list',
        name: 'backend',
        message: 'Where do you want to execute your tests?',
        choices: ['On my local machine', 'In the cloud using Sauce Labs, Browserstack or Testingbot', 'In the cloud using a different service', 'I have my own Selenium cloud']
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the host address of that cloud service?',
        when: function when(answers) {
            return answers.backend.indexOf('different service') > -1;
        }
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port on which that service is running?',
        'default': '80',
        when: function when(answers) {
            return answers.backend.indexOf('different service') > -1;
        }
    }, {
        type: 'input',
        name: 'env_user',
        message: 'Environment variable for username',
        'default': 'SAUCE_USERNAME',
        when: function when(answers) {
            return answers.backend.indexOf('In the cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'env_key',
        message: 'Environment variable for access key',
        'default': 'SAUCE_ACCESS_KEY',
        when: function when(answers) {
            return answers.backend.indexOf('In the cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the IP or URI to your Selenium standalone server?',
        'default': '0.0.0.0',
        when: function when(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port which your Selenium standalone server is running on?',
        'default': '4444',
        when: function when(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'input',
        name: 'path',
        message: 'What is the path to your Selenium standalone server?',
        'default': '/wd/hub',
        when: function when(answers) {
            return answers.backend.indexOf('own Selenium cloud') > -1;
        }
    }, {
        type: 'list',
        name: 'framework',
        message: 'Which framework do you want to use?',
        choices: SUPPORTED_FRAMEWORKS
    }, {
        type: 'confirm',
        name: 'installFramework',
        message: 'Shall I install the framework adapter for you?',
        'default': true
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your test specs located?',
        'default': './test/specs/**/*.js',
        when: function when(answers) {
            return answers.framework.match(/(mocha|jasmine)/);
        }
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your feature files located?',
        'default': './features/**/*.feature',
        when: function when(answers) {
            return answers.framework === 'cucumber';
        }
    }, {
        type: 'input',
        name: 'stepDefinitions',
        message: 'Where are your step definitions located?',
        'default': './features/step-definitions/**/*.js',
        when: function when(answers) {
            return answers.framework === 'cucumber';
        }
    }, {
        type: 'checkbox',
        name: 'reporters',
        message: 'Which reporter do you want to use?',
        choices: SUPPORTED_REPORTER,
        filter: function filter(reporters) {
            return reporters.map(function (reporter) {
                return 'wdio-' + reporter.split(/\-/)[0].trim() + '-reporter';
            });
        }
    }, {
        type: 'confirm',
        name: 'installReporter',
        message: 'Shall I install the reporter library for you?',
        'default': true,
        when: function when(answers) {
            return answers.reporters.length > 0;
        }
    }, {
        type: 'checkbox',
        name: 'services',
        message: 'Do you want to add a service to your test setup?',
        choices: SUPPORTED_SERVICES,
        filter: function filter(services) {
            return services.map(function (service) {
                return 'wdio-' + service.split(/\-/)[0].trim() + '-service';
            });
        }
    }, {
        type: 'confirm',
        name: 'installServices',
        message: 'Shall I install the services for you?',
        'default': true,
        when: function when(answers) {
            return answers.services.length > 0;
        }
    }, {
        type: 'input',
        name: 'outputDir',
        message: 'In which directory should the xunit reports get stored?',
        'default': './',
        when: function when(answers) {
            return answers.reporters === 'junit';
        }
    }, {
        type: 'list',
        name: 'logLevel',
        message: 'Level of logging verbosity',
        'default': 'silent',
        choices: ['silent', 'verbose', 'command', 'data', 'result', 'error']
    }, {
        type: 'input',
        name: 'screenshotPath',
        message: 'In which directory should screenshots gets saved if a command fails?',
        'default': './errorShots/'
    }, {
        type: 'input',
        name: 'baseUrl',
        message: 'What is the base url?',
        'default': 'http://localhost'
    }], function (answers) {
        var packagesToInstall = [];
        if (answers.installFramework) {
            packagesToInstall.push('wdio-' + answers.framework + '-framework');
        }
        if (answers.installReporter) {
            packagesToInstall = packagesToInstall.concat(answers.reporters);
        }
        if (answers.installServices) {
            packagesToInstall = packagesToInstall.concat(answers.services);
        }

        if (packagesToInstall.length > 0) {
            console.log('\nInstalling wdio packages:');
            return (0, _npmInstallPackage2['default'])(packagesToInstall, { saveDev: true }, function (err) {
                if (err) {
                    throw err;
                }

                console.log('\nPackages installed successfully, creating configuration file...');
                renderConfigurationFile(answers);
            });
        }

        renderConfigurationFile(answers);
        process.exit(0);
    });
}

function renderConfigurationFile(answers) {
    var tpl = _fs2['default'].readFileSync(__dirname + '/helpers/wdio.conf.ejs', 'utf8');
    var renderedTpl = _ejs2['default'].render(tpl, {
        answers: answers
    });
    _fs2['default'].writeFileSync(_path2['default'].join(process.cwd(), 'wdio.conf.js'), renderedTpl);
    console.log('\nConfiguration file was created successfully!\nTo run your tests, execute:\n\n$ wdio wdio.conf.js\n');
}

/**
 * sanitize cucumberOpts
 */
if (argv.cucumberOpts) {
    if (argv.cucumberOpts.tags) {
        argv.cucumberOpts.tags = argv.cucumberOpts.tags.split(',');
    }
    if (argv.cucumberOpts.ignoreUndefinedDefinitions) {
        argv.cucumberOpts.ignoreUndefinedDefinitions = argv.cucumberOpts.ignoreUndefinedDefinitions === 'true';
    }
    if (argv.cucumberOpts.require) {
        argv.cucumberOpts.require = argv.cucumberOpts.require.split(',');
    }
}

/**
 * sanitize jasmineOpts
 */
if (argv.jasmineOpts && argv.jasmineOpts.defaultTimeoutInterval) {
    argv.jasmineOpts.defaultTimeoutInterval = parseInt(argv.jasmineOpts.defaultTimeoutInterval, 10);
}

/**
 * sanitize mochaOpts
 */
if (argv.mochaOpts) {
    if (argv.mochaOpts.timeout) {
        argv.mochaOpts.timeout = parseInt(argv.mochaOpts.timeout, 10);
    }
    if (argv.mochaOpts.compilers) {
        argv.mochaOpts.compilers = argv.mochaOpts.compilers.split(',');
    }
    if (argv.mochaOpts.require) {
        argv.mochaOpts.require = argv.mochaOpts.require.split(',');
    }
}

var args = {};
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = _getIterator(ALLOWED_ARGV), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        if (argv[key]) {
            args[key] = argv[key];
        }
    }

    /**
     * run launch sequence if config command wasn't called
     */
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}

if (!configMode) {
    var launcher = new _launcher2['default'](configFile, args);
    launcher.run().then(function (code) {
        return process.exit(code);
    }, function (e) {
        return process.nextTick(function () {
            throw e;
        });
    });
}
