export const SUPPORTED_FRAMEWORKS = [
    ' mocha - https://www.npmjs.com/package/@wdio/mocha-framework',
    ' jasmine - https://www.npmjs.com/package/@wdio/jasmine-framework'
]

export const SUPPORTED_REPORTER = [
    ' dot - https://www.npmjs.com/package/@wdio/dot-reporter',
    ' spec - https://www.npmjs.com/package/@wdio/spec-reporter',
    ' junit - https://www.npmjs.com/package/@wdio/junit-reporter',
    ' allure - https://www.npmjs.com/package/@wdio/allure-reporter',
    ' sumologic - https://www.npmjs.com/package/@wdio/sumologic-reporter',
    ' concise - https://www.npmjs.com/package/@wdio/concise-reporter',
    ' reportportal - https://www.npmjs.com/package/wdio-reportportal-reporter',
    ' video - https://www.npmjs.com/package/wdio-video-reporter',
    ' html - https://www.npmjs.com/package/@rpii/wdio-html-reporter',
    ' json - https://www.npmjs.com/package/wdio-json-reporter',
    ' mochawesome - https://www.npmjs.com/package/wdio-mochawesome-reporter',
    ' timeline - https://www.npmjs.com/package/wdio-timeline-reporter',
]

export const SUPPORTED_SERVICES = [
    ' sauce - https://www.npmjs.com/package/@wdio/sauce-service',
    ' testingbot - https://www.npmjs.com/package/@wdio/testingbot-service',
    ' selenium-standalone - https://www.npmjs.com/package/@wdio/selenium-standalone-service',
    ' chromedriver - https://www.npmjs.com/package/wdio-chromedriver-service',
    ' devtools - https://www.npmjs.com/package/@wdio/devtools-service',
    ' applitools - https://www.npmjs.com/package/@wdio/applitools-service',
    ' browserstack - https://www.npmjs.com/package/@wdio/browserstack-service',
    ' crossbrowsertesting - https://www.npmjs.com/package/wdio-crossbrowsertesting-service',
    ' appium - https://www.npmjs.com/package/@wdio/appium-service',
    ' intercept - https://www.npmjs.com/package/wdio-intercept-service',
    ' zafira-listener - https://www.npmjs.com/package/wdio-zafira-listener-service',
    ' reportportal - https://www.npmjs.com/package/wdio-reportportal-service',
    ' docker - https://www.npmjs.com/package/wdio-docker-service',
    ' firefox-profile - https://www.npmjs.com/package/@wdio/firefox-profile-service'
]

export const EXCLUSIVE_SERVICES = {
    'wdio-chromedriver-service': {
        services: ['@wdio/selenium-standalone-service'],
        message: '@wdio/selenium-standalone-service already includes chromedriver'
    }
}

export const SUPPORTED_RUNNERS = [
    ' local - https://www.npmjs.com/package/@wdio/local-runner'
]

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent']

export const USAGE = `
WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>
Usage: wdio install <type> <name>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override configured specs.
Same applies to the exclude option. It can take a list of specs to exclude for a given run
and it also overrides the exclude key from the config file.`

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
    name: 'hostname',
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
    description: 'stop test runner after specific amount of tests have failed',
    type: 'number'
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
    description: 'defines the framework (Mocha, Jasmine or Cucumber) to run the specs',
    type: 'string'
}, {
    name: 'reporters',
    alias: 'r',
    description: 'reporters to print out the results on stdout',
    type: 'array'
}, {
    name: 'suite',
    description: 'overwrites the specs attribute and runs the defined suite',
    type: 'array'
}, {
    name: 'spec',
    description: 'run only a certain spec file - overrides specs piped from stdin',
    type: 'array'
}, {
    name: 'exclude',
    description: 'exclude certain spec file from the test run - overrides exclude piped from stdin',
    type: 'array'
}, {
    name: 'mochaOpts',
    description: 'Mocha options'
}, {
    name: 'jasmineOpts',
    description: 'Jasmine options'
}, {
    name: 'cucumberOpts',
    description: 'Cucumber options'
}]

export const QUESTIONNAIRE = [{
    type: 'list',
    name: 'runner',
    message: 'Where should your tests be launched?',
    choices: SUPPORTED_RUNNERS,
}, {
    type: 'list',
    name: 'backend',
    message: 'Where is your automation backend located?',
    choices: [
        'On my local machine',
        'In the cloud using Sauce Labs',
        'In the cloud using Browserstack or Testingbot or a different service',
        'I have my own Selenium cloud'
    ]
}, {
    type: 'input',
    name: 'hostname',
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
    default: 'BROWSERSTACK_USER',
    when: (answers) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'BROWSERSTACK_ACCESSKEY',
    when: (answers) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'SAUCE_USERNAME',
    when: (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'SAUCE_ACCESS_KEY',
    when: (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'confirm',
    name: 'headless',
    message: 'Do you want to run your test on Sauce Headless? (https://saucelabs.com/products/web-testing/sauce-headless)',
    default: false,
    when: (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'list',
    name: 'region',
    message: 'In which region do you want to run your Sauce Labs tests in?',
    choices: [
        'us',
        'eu'
    ],
    when: (answers) => !answers.headless && answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the IP or URI to your Selenium standalone or grid server?',
    default: 'localhost',
    when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port which your Selenium standalone or grid server is running on?',
    default: '4444',
    when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'path',
    message: 'What is the path to your Selenium standalone or grid server?',
    default: '/wd/hub',
    when: (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'list',
    name: 'framework',
    message: 'Which framework do you want to use?',
    choices: SUPPORTED_FRAMEWORKS,
}, {
    type: 'list',
    name: 'executionMode',
    message: 'Do you want to run WebdriverIO commands synchronous or asynchronous?',
    choices: [
        'sync',
        'async'
    ]
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
    when: (answers) => answers.framework.includes('cucumber')
}, {
    type: 'input',
    name: 'stepDefinitions',
    message: 'Where are your step definitions located?',
    default: './features/step-definitions',
    when: (answers) => answers.framework.includes('cucumber')
}, {
    type: 'checkbox',
    name: 'reporters',
    message: 'Which reporter do you want to use?',
    choices: SUPPORTED_REPORTER,
    default: SUPPORTED_REPORTER.filter(reporter => reporter.includes('spec-reporter'))
}, {
    type: 'checkbox',
    name: 'services',
    message: 'Do you want to add a service to your test setup?',
    choices: SUPPORTED_SERVICES,
    default: SUPPORTED_SERVICES.filter(service => service.includes('wdio-chromedriver-service')),
    validate: (answers) => {
        let result = true

        Object.entries(EXCLUSIVE_SERVICES).forEach(([name, { services, message }]) => {
            if (answers.includes(name) && answers.some(s => services.includes(s))) {
                result = `${name} cannot work together with ${services.join(', ')}\n${message}\nPlease uncheck one of them.`
            }
        })

        return result
    }
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
    type: 'input',
    name: 'baseUrl',
    message: 'What is the base url?',
    default: 'http://localhost'
}]
