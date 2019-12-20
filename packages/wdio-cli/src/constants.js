import { version } from '../package.json'
import { validateServiceAnswers } from './utils'

export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${version})`

export const EXCLUSIVE_SERVICES = {
    'wdio-chromedriver-service': {
        services: ['@wdio/selenium-standalone-service'],
        message: '@wdio/selenium-standalone-service already includes chromedriver'
    }
}

export const CONFIG_HELPER_INTRO = `
=========================
WDIO Configuration Helper
=========================
`

export const CONFIG_HELPER_SUCCESS_MESSAGE = `
Configuration file was created successfully!
To run your tests, execute:
$ wdio run wdio.conf.js
`

export const ANDROID_CONFIG = {
    platformName: 'Android',
    automationName: 'UiAutomator2',
    deviceName: 'Test'
}

export const IOS_CONFIG = {
    platformName: 'iOS',
    automationName: 'XCUITest',
    deviceName: 'iPhone Simulator'
}

/**
 * We have to use a string hash for value because InquirerJS default values do not work if we have
 * objects as a `value` to be stored from the user's answers.
 */
export const SUPPORTED_PACKAGES = {
    runner: [
        { name: 'local', value: '@wdio/local-runner$--$local' }
    ],
    framework: [
        { name: 'mocha', value: '@wdio/mocha-framework$--$mocha' },
        { name: 'jasmine', value: '@wdio/jasmine-framework$--$jasmine' },
        { name: 'cucumber', value: '@wdio/cucumber-framework$--$cucumber' }
    ],
    reporter: [
        { name: 'spec', value: '@wdio/spec-reporter$--$spec' },
        { name: 'dot', value: '@wdio/dot-reporter$--$dot' },
        { name: 'junit', value: '@wdio/junit-reporter$--$junit' },
        { name: 'allure', value: '@wdio/allure-reporter$--$allure' },
        { name: 'sumologic', value: '@wdio/sumologic-reporter$--$sumologic' },
        { name: 'concise', value: '@wdio/concise-reporter$--$concise' },
        // external
        { name: 'reportportal', value: 'wdio-reportportal-reporter$--$reportportal' },
        { name: 'video', value: 'wdio-video-reporter$--$video' },
        { name: 'json', value: 'wdio-json-reporter$--$json' },
        { name: 'cucumber', value: 'wdio-cucumber-reporter$--$cucumber' },
        { name: 'mochawesome', value: 'wdio-mochawesome-reporter$--$mochawesome' },
        { name: 'timeline', value: 'wdio-timeline-reporter$--$timeline' },
        { name: 'html', value: '@rpii/wdio-html-reporter$--$html' },
    ],
    service: [
        // inquirerjs shows list as its orderer in array
        // put chromedriver first as it is the default option
        { name: 'chromedriver', value: 'wdio-chromedriver-service$--$chromedriver' },
        // internal
        { name: 'sauce', value: '@wdio/sauce-service$--$sauce' },
        { name: 'testingbot', value: '@wdio/testingbot-service$--$testingbot' },
        { name: 'selenium-standalone', value: '@wdio/selenium-standalone-service$--$selenium-standalone' },
        { name: 'devtools', value: '@wdio/devtools-service$--$devtools' },
        { name: 'applitools', value: '@wdio/applitools-service$--$applitools' },
        { name: 'browserstack', value: '@wdio/browserstack-service$--$browserstack' },
        { name: 'appium', value: '@wdio/appium-service$--$appium' },
        { name: 'firefox-profile', value: '@wdio/firefox-profile-service$--$firefox-profile' },
        { name: 'crossbrowsertesting', value: '@wdio/crossbrowsertesting-service$--$crossbrowsertesting' },
        { name: 'slack', value: '@wdio/slack-service$--$slack' },
        // external
        { name: 'zafira-listener', value: 'wdio-zafira-listener-service$--$zafira-listener' },
        { name: 'reportportal', value: 'wdio-reportportal-service$--$reportportal' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'wiremock', value: 'wdio-wiremock-service$--$wiremock' },
    ],
}

export const QUESTIONNAIRE = [{
    type: 'list',
    name: 'runner',
    message: 'Where should your tests be launched?',
    choices: SUPPORTED_PACKAGES.runner,
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
    when: /* istanbul ignore next */ (answers) => answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port on which that service is running?',
    default: '80',
    when: /* istanbul ignore next */ (answers) => answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'BROWSERSTACK_USER',
    when: /* istanbul ignore next */ (answers) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'BROWSERSTACK_ACCESSKEY',
    when: /* istanbul ignore next */ (answers) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'SAUCE_USERNAME',
    when: /* istanbul ignore next */ (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'SAUCE_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'confirm',
    name: 'headless',
    message: 'Do you want to run your test on Sauce Headless? (https://saucelabs.com/products/web-testing/sauce-headless)',
    default: false,
    when: /* istanbul ignore next */ (answers) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'list',
    name: 'region',
    message: 'In which region do you want to run your Sauce Labs tests in?',
    choices: [
        'us',
        'eu'
    ],
    when: /* istanbul ignore next */ (answers) => !answers.headless && answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the IP or URI to your Selenium standalone or grid server?',
    default: 'localhost',
    when: /* istanbul ignore next */ (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port which your Selenium standalone or grid server is running on?',
    default: '4444',
    when: /* istanbul ignore next */ (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'path',
    message: 'What is the path to your Selenium standalone or grid server?',
    default: '/wd/hub',
    when: /* istanbul ignore next */ (answers) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'list',
    name: 'framework',
    message: 'Which framework do you want to use?',
    choices: SUPPORTED_PACKAGES.framework,
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
    when: /* istanbul ignore next */ (answers) => answers.framework.match(/(mocha|jasmine)/)
}, {
    type: 'input',
    name: 'specs',
    message: 'Where are your feature files located?',
    default: './features/**/*.feature',
    when: /* istanbul ignore next */ (answers) => answers.framework.includes('cucumber')
}, {
    type: 'input',
    name: 'stepDefinitions',
    message: 'Where are your step definitions located?',
    default: './features/step-definitions',
    when: /* istanbul ignore next */ (answers) => answers.framework.includes('cucumber')
}, {
    type: 'checkbox',
    name: 'reporters',
    message: 'Which reporter do you want to use?',
    choices: SUPPORTED_PACKAGES.reporter,
    default: [SUPPORTED_PACKAGES.reporter.find(
        /* istanbul ignore next */
        ({ name }) => name === 'spec').value
    ]
}, {
    type: 'checkbox',
    name: 'services',
    message: 'Do you want to add a service to your test setup?',
    choices: SUPPORTED_PACKAGES.service,
    default: [SUPPORTED_PACKAGES.service.find(
        /* istanbul ignore next */
        ({ name }) => name === 'chromedriver').value
    ],
    validate: validateServiceAnswers
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the xunit reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers) => answers.reporters.includes('junit')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers) => answers.reporters.includes('json')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the mochawesome json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers) => answers.reporters.includes('mochawesome')
}, {
    type: 'input',
    name: 'baseUrl',
    message: 'What is the base url?',
    default: 'http://localhost'
}]
