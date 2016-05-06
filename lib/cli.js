'use strict'

import path from 'path'
import fs from 'fs'
import ejs from 'ejs'
import npmInstallPackage from 'npm-install-package'
import inquirer from 'inquirer'
import optimist from 'optimist'

import Launcher from './launcher'
import pkg from '../package.json'

/**
 * 💌 Dear contributors 💌
 * ========================================================================
 * If you are awesome and have created a new reporter, service or framework
 * adaption feel free to add it to this list and make a PR so people know
 * that your add-on is available and supported. Thanks, you 🚀!
 * ========================================================================
 */
const SUPPORTED_FRAMEWORKS = [
    'mocha',   // https://github.com/webdriverio/wdio-mocha-framework
    'jasmine', // https://github.com/webdriverio/wdio-jasmine-framework
    'cucumber' // https://github.com/webdriverio/wdio-cucumber-framework
]
const SUPPORTED_REPORTER = [
    ' dot - https://github.com/webdriverio/wdio-dot-reporter',
    ' junit - https://github.com/webdriverio/wdio-junit-reporter',
    ' allure - https://github.com/webdriverio/wdio-allure-reporter',
    ' teamcity - https://github.com/sullenor/wdio-teamcity-reporter',
    ' json - https://github.com/fijijavis/wdio-json-reporter'
]
const SUPPORTED_SERVICES = [
    ' sauce - https://github.com/webdriverio/wdio-sauce-service',
    ' testingbot - https://github.com/testingbot/wdio-testingbot-service',
    ' firefox-profile - https://github.com/webdriverio/wdio-firefox-profile-service',
    ' selenium-standalone - https://github.com/webdriverio/wdio-selenium-standalone-service'
]

const VERSION = pkg.version
const ALLOWED_ARGV = ['host', 'port', 'path', 'user', 'key', 'logLevel', 'coloredLogs', 'screenshotPath',
                      'baseUrl', 'waitforTimeout', 'framework', 'reporters', 'suite', 'cucumberOpts', 'jasmineOpts', 'mochaOpts',
                      'connectionRetryTimeout', 'connectionRetryCount']

optimist
    .usage('WebdriverIO CLI runner\n\n' +
        'Usage: wdio [options] [configFile]\n' +
        'config file defaults to wdio.conf.js\n' +
        'The [options] object will override values from the config file.')

    .describe('help', 'prints WebdriverIO help menu')
    .alias('help', 'h')
    .describe('version', 'prints WebdriverIO version')
    .alias('version', 'v')
    .describe('host', 'Selenium server host address')
    .describe('port', 'Selenium server port')
    .describe('path', 'Selenium server path (default: /wd/hub)')
    .describe('user', 'username if using a cloud service as Selenium backend')
    .alias('user', 'u')
    .describe('key', 'corresponding access key to the user')
    .alias('key', 'k')
    .describe('logLevel', 'level of logging verbosity (default: silent)')
    .alias('logLevel', 'l')
    .describe('coloredLogs', 'if true enables colors for log output (default: true)')
    .alias('coloredLogs', 'c')
    .describe('screenshotPath', 'saves a screenshot to a given path if a command fails')
    .alias('screenshotPath', 's')
    .describe('baseUrl', 'shorten url command calls by setting a base url')
    .alias('baseUrl', 'b')
    .describe('waitforTimeout', 'timeout for all waitForXXX commands (default: 500ms)')
    .alias('waitforTimeout', 'w')
    .describe('framework', 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs (default: mocha)')
    .alias('framework', 'f')
    .describe('reporters', 'reporter to print out the results on stdout')
    .alias('reporters', 'r')
    .describe('suite', 'overwrites the specs attribute and runs the defined suite')
    .describe('cucumberOpts.*', 'Cucumber options, see the full list options at https://github.com/webdriverio/wdio-cucumber-framework#cucumberopts-options')
    .describe('jasmineOpts.*', 'Jasmine options, see the full list options at https://github.com/webdriverio/wdio-jasmine-framework#jasminenodeopts-options')
    .describe('mochaOpts.*', 'Mocha options, see the full list options at http://mochajs.org')

    .check((arg) => {
        if (arg._.length > 1) {
            throw new Error('Error: more than one config file specified')
        }
    })

let argv = optimist.parse(process.argv.slice(2))

if (argv.help) {
    optimist.showHelp()
    process.exit(0)
}

if (argv.version) {
    console.log(`v${VERSION}`)
    process.exit(0)
}

/**
 * use wdio.conf.js default file name if no config was specified
 * otherwise run config sequenz
 */
let configFile = argv._[0]
if (!configFile) {
    if (fs.existsSync('./wdio.conf.js')) {
        configFile = './wdio.conf.js'
    } else {
        argv._[0] = 'config'
    }
}

let configMode = false
if (argv._[0] === 'config') {
    configMode = true
    console.log(`
=========================
WDIO Configuration Helper
=========================
`)
    inquirer.prompt([{
        type: 'list',
        name: 'backend',
        message: 'Where do you want to execute your tests?',
        choices: [
            'On my local machine',
            'In the cloud using Sauce Labs, Browserstack or Testingbot',
            'In the cloud using a different service',
            'I have my own Selenium cloud'
        ]
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the host address of that cloud service?',
        when: (answers) => answers.backend.indexOf('different service') > -1
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port on which that service is running?',
        default: '80',
        when: (answers) => answers.backend.indexOf('different service') > -1
    }, {
        type: 'input',
        name: 'env_user',
        message: 'Environment variable for username',
        default: 'SAUCE_USERNAME',
        when: (answers) => answers.backend.indexOf('In the cloud') > -1
    }, {
        type: 'input',
        name: 'env_key',
        message: 'Environment variable for access key',
        default: 'SAUCE_ACCESS_KEY',
        when: (answers) => answers.backend.indexOf('In the cloud') > -1
    }, {
        type: 'input',
        name: 'host',
        message: 'What is the IP or URI to your Selenium standalone server?',
        default: '0.0.0.0',
        when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
    }, {
        type: 'input',
        name: 'port',
        message: 'What is the port which your Selenium standalone server is running on?',
        default: '4444',
        when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
    }, {
        type: 'input',
        name: 'path',
        message: 'What is the path to your Selenium standalone server?',
        default: '/wd/hub',
        when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
    }, {
        type: 'list',
        name: 'framework',
        message: 'Which framework do you want to use?',
        choices: SUPPORTED_FRAMEWORKS
    }, {
        type: 'confirm',
        name: 'installFramework',
        message: 'Shall I install the framework adapter for you?',
        default: true
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your test specs located?',
        default: './test/specs/**/*.js',
        when: (answers) => answers.framework.match(/(mocha|jasmine)/)
    }, {
        type: 'input',
        name: 'specs',
        message: 'Where are your feature files located?',
        default: './features/**/*.feature',
        when: (answers) => answers.framework === 'cucumber'
    }, {
        type: 'input',
        name: 'stepDefinitions',
        message: 'Where are your step definitions located?',
        default: './features/step-definitions/**/*.js',
        when: (answers) => answers.framework === 'cucumber'
    }, {
        type: 'checkbox',
        name: 'reporters',
        message: 'Which reporter do you want to use?',
        choices: SUPPORTED_REPORTER,
        filter: (reporters) => reporters.map((reporter) => `wdio-${reporter.split(/\-/)[0].trim()}-reporter`)
    }, {
        type: 'confirm',
        name: 'installReporter',
        message: 'Shall I install the reporter library for you?',
        default: true,
        when: (answers) => answers.reporters.length > 0
    }, {
        type: 'checkbox',
        name: 'services',
        message: 'Do you want to add a service to your test setup?',
        choices: SUPPORTED_SERVICES,
        filter: (services) => services.map((service) => `wdio-${service.split(/\-/)[0].trim()}-service`)
    }, {
        type: 'confirm',
        name: 'installServices',
        message: 'Shall I install the services for you?',
        default: true,
        when: (answers) => answers.services.length > 0
    }, {
        type: 'input',
        name: 'outputDir',
        message: 'In which directory should the xunit reports get stored?',
        default: './',
        when: (answers) => answers.reporters === 'junit'
    }, {
        type: 'input',
        name: 'outputDir',
        message: 'In which directory should the json reports get stored?',
        default: './',
        when: (answers) => answers.reporters === 'json'
    }, {
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
        default: 'http://localhost'
    }], (answers) => {
        let packagesToInstall = []
        if (answers.installFramework) {
            packagesToInstall.push(`wdio-${answers.framework}-framework`)
        }
        if (answers.installReporter) {
            packagesToInstall = packagesToInstall.concat(answers.reporters)
        }
        if (answers.installServices) {
            packagesToInstall = packagesToInstall.concat(answers.services)
        }

        if (packagesToInstall.length > 0) {
            console.log('\nInstalling wdio packages:')
            return npmInstallPackage(packagesToInstall, { saveDev: true }, (err) => {
                if (err) {
                    throw err
                }

                console.log('\nPackages installed successfully, creating configuration file...')
                renderConfigurationFile(answers)
            })
        }

        renderConfigurationFile(answers)
        process.exit(0)
    })
}

function renderConfigurationFile (answers) {
    let tpl = fs.readFileSync(__dirname + '/helpers/wdio.conf.ejs', 'utf8')
    let renderedTpl = ejs.render(tpl, {
        answers: answers
    })
    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
    console.log(`
Configuration file was created successfully!
To run your tests, execute:

$ wdio wdio.conf.js
`)
}

/**
 * sanitize cucumberOpts
 */
if (argv.cucumberOpts) {
    if (argv.cucumberOpts.tags) {
        argv.cucumberOpts.tags = argv.cucumberOpts.tags.split(',')
    }
    if (argv.cucumberOpts.ignoreUndefinedDefinitions) {
        argv.cucumberOpts.ignoreUndefinedDefinitions = argv.cucumberOpts.ignoreUndefinedDefinitions === 'true'
    }
    if (argv.cucumberOpts.require) {
        argv.cucumberOpts.require = argv.cucumberOpts.require.split(',')
    }
}

/**
 * sanitize jasmineOpts
 */
if (argv.jasmineOpts && argv.jasmineOpts.defaultTimeoutInterval) {
    argv.jasmineOpts.defaultTimeoutInterval = parseInt(argv.jasmineOpts.defaultTimeoutInterval, 10)
}

/**
 * sanitize mochaOpts
 */
if (argv.mochaOpts) {
    if (argv.mochaOpts.timeout) {
        argv.mochaOpts.timeout = parseInt(argv.mochaOpts.timeout, 10)
    }
    if (argv.mochaOpts.compilers) {
        argv.mochaOpts.compilers = argv.mochaOpts.compilers.split(',')
    }
    if (argv.mochaOpts.require) {
        argv.mochaOpts.require = argv.mochaOpts.require.split(',')
    }
}

let args = {}
for (let key of ALLOWED_ARGV) {
    if (argv[key]) {
        args[key] = argv[key]
    }
}

/**
 * run launch sequence if config command wasn't called
 */
if (!configMode) {
    let launcher = new Launcher(configFile, args)
    launcher.run().then(
        (code) => process.exit(code),
        (e) => process.nextTick(() => {
            throw e
        }))
}
