export const SUPPORTED_FRAMEWORKS = [
    'mocha', // https://github.com/webdriverio/wdio-mocha-framework
    'jasmine', // https://github.com/webdriverio/wdio-jasmine-framework
    'cucumber' // https://github.com/webdriverio/wdio-cucumber-framework
]

export const SUPPORTED_REPORTER = [
    ' dot - https://github.com/webdriverio/wdio-dot-reporter',
    ' spec - https://github.com/webdriverio/wdio-spec-reporter',
    ' junit - https://github.com/webdriverio/wdio-junit-reporter',
    ' allure - https://github.com/webdriverio/wdio-allure-reporter',
    ' teamcity - https://github.com/sullenor/wdio-teamcity-reporter',
    ' json - https://github.com/fijijavis/wdio-json-reporter',
    ' concise - https://github.com/FloValence/wdio-concise-reporter',
    ' testrail - https://github.com/oxynade/wdio-testrail-reporter',
    ' mochawesome - https://github.com/fijijavis/wdio-mochawesome-reporter'
]

export const SUPPORTED_SERVICES = [
    ' sauce - https://github.com/webdriverio/wdio-sauce-service',
    ' browserstack - https://github.com/itszero/wdio-browserstack-service',
    ' testingbot - https://github.com/testingbot/wdio-testingbot-service',
    ' appium - https://github.com/rhysd/wdio-appium-service',
    ' firefox-profile - https://github.com/webdriverio/wdio-firefox-profile-service',
    ' selenium-standalone - https://github.com/webdriverio/wdio-selenium-standalone-service',
    ' phantomjs - https://github.com/cognitom/wdio-phantomjs-service',
    ' static-server - https://github.com/LeadPages/wdio-static-server-service',
    ' visual-regression - https://github.com/zinserjan/wdio-visual-regression-service',
    ' webpack - https://github.com/leadpages/wdio-webpack-service',
    ' webpack-dev-server - https://gitlab.com/Vinnl/wdio-webpack-dev-server-service',
    ' chromedriver - https://github.com/atti187/wdio-chromedriver-service',
    ' iedriver - https://github.com/atti187/wdio-iedriver-service'
]

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error']

export const USAGE = `
WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override configured specs`

export const CONFIG_HELPER_INTRO = `
=========================
WDIO Configuration Helper
=========================
`

export const CONFIG_HELPER_SUCCESS_MESSAGE = `
Configuration file was created successfully!
To run your tests, execute:
$ wdio wdio.conf.js
`

export const CLI_PARAMS = [{
    name: 'help',
    description: 'prints WebdriverIO help menu'
}, {
    name: 'version',
    description: 'prints WebdriverIO version'
}, {
    name: 'host',
    alias: 'h',
    describe: 'automation driver host address',
    type: 'string'
}, {
    name: 'port',
    alias: 'p',
    describe: 'automation driver port',
    type: 'number'
}, {
    name: 'user',
    alias: 'u',
    description: 'username if using a cloud service as automation backend',
    type: 'string'
}, {
    name: 'key',
    alias: 'k',
    description: 'corresponding access key to the user',
    type: 'string'
}, {
    name: 'watch',
    description: 'watch specs for changes',
    type: 'boolean'
}, {
    name: 'logLevel',
    alias: 'l',
    description: 'level of logging verbosity',
    choices: LOG_LEVELS
}, {
    name: 'bail',
    description: `stop test runner after specific amount of tests have failed`,
    type: 'number'
}, {
    name: 'screenshotPath',
    alias: 's',
    description: `saves a screenshot to a given path if a command fails`,
}, {
    name: 'baseUrl',
    description: 'shorten url command calls by setting a base url',
    type: 'string'
}, {
    name: 'waitforTimeout',
    alias: 'w',
    description: 'timeout for all waitForXXX commands',
    type: 'number'
}, {
    name: 'framework',
    alias: 'f',
    description: `defines the framework (Mocha, Jasmine or Cucumber) to run the specs`,
    type: 'string'
}, {
    name: 'reporters',
    alias: 'r',
    description: `reporters to print out the results on stdout`,
    type: 'array'
}, {
    name: 'suite',
    description: `overwrites the specs attribute and runs the defined suite`,
    type: 'array'
}, {
    name: 'spec',
    description: `run only a certain spec file - overrides specs piped from stdin`,
    type: 'array'
}, {
    name: 'mochaOpts',
    description: `Mocha options`
}, {
    name: 'jasmineOpts',
    description: `Jasmine options`
}, {
    name: 'cucumberOpts',
    description: `Cucumber options`
}]

export const QUESTIONNAIRE = [{
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
    default: './features/step-definitions',
    when: (answers) => answers.framework === 'cucumber'
}, {
    type: 'checkbox',
    name: 'reporters',
    message: 'Which reporter do you want to use?',
    choices: SUPPORTED_REPORTER,
    filter: (reporters) => reporters.map((reporter) => `wdio-${reporter.split(/-/)[0].trim()}-reporter`)
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
    filter: (services) => services.map((service) => `wdio-${service.split(/- /)[0].trim()}-service`)
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
    when: (answers) => answers.reporters.includes('junit')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the json reports get stored?',
    default: './',
    when: (answers) => answers.reporters.includes('json')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the mochawesome json reports get stored?',
    default: './',
    when: (answers) => answers.reporters.includes('mochawesome')
}, {
    type: 'list',
    name: 'logLevel',
    message: 'Level of logging verbosity',
    default: 'silent',
    choices: LOG_LEVELS
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
}]
