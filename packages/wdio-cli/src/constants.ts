import { validateServiceAnswers, hasFile } from './utils'

const pkg = require('../package.json')

export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${pkg.version})`

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
$ npx wdio run wdio.conf.js
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

export const COMPILER_OPTIONS = {
    babel: 'Babel (https://babeljs.io/)',
    ts: 'TypeScript (https://www.typescriptlang.org/)',
    nil: 'No!'
}
export const TS_COMPILER_INSTRUCTIONS = `To have TypeScript support please add the following packages to your "types" list:
{
  "compilerOptions": {
    "types": ["node", %s]
  }
}

For for information on TypeScript integration check out: https://webdriver.io/docs/typescript.html
`

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
        { name: 'markdown', value: 'carmenmitru/wdio-markdown-reporter' }
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
        // external
        { name: 'lambdatest', value: 'wdio-lambdatest-service$--$lambdatest' },
        { name: 'zafira-listener', value: 'wdio-zafira-listener-service$--$zafira-listener' },
        { name: 'reportportal', value: 'wdio-reportportal-service$--$reportportal' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'wiremock', value: 'wdio-wiremock-service$--$wiremock' },
        { name: 'ng-apimock', value: 'wdio-ng-apimock-service$--ng-apimock' },
        { name: 'slack', value: 'wdio-slack-service$--$slack' },
        { name: 'intercept', value: 'wdio-intercept-service$--$intercept' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'visual-regression-testing', value: 'wdio-image-comparison-service$--$visual-regression-testing' },
        { name: 'novus-visual-regression', value: 'wdio-novus-visual-regression-service$--$novus-visual-regression' },
        { name: 'rerun', value: 'wdio-rerun-service$--$rerun' }
    ]
}

export const QUESTIONNAIRE = [{
    type: 'list',
    name: 'runner',
    message: 'Where should your tests be launched?',
    choices: SUPPORTED_PACKAGES.runner,
    // only ask if there are more than 1 runner to pick from
    when: /* istanbul ignore next */ () => SUPPORTED_PACKAGES.runner.length > 1
}, {
    type: 'list',
    name: 'backend',
    message: 'Where is your automation backend located?',
    choices: [
        'On my local machine',
        'In the cloud using Experitest',
        'In the cloud using Sauce Labs',
        'In the cloud using Browserstack or Testingbot or LambdaTest or a different service',
        'I have my own Selenium cloud'
    ]
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the host address of that cloud service?',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port on which that service is running?',
    default: '80',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'expEnvAccessKey',
    message: 'Access key from Experitest Cloud',
    default: 'EXPERITEST_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Experitest'
}, {
    type: 'input',
    name: 'expEnvHostname',
    message: 'Environment variable for cloud url',
    default: 'example.experitest.com',
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Experitest'
}, {
    type: 'input',
    name: 'expEnvPort',
    message: 'Environment variable for port',
    default: '443',
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Experitest'
}, {
    type: 'list',
    name: 'expEnvProtocol',
    message: 'Choose a protocol for environment variable',
    default: 'https',
    choices: [
        'https',
        'http'
    ],
    when: /* istanbul ignore next */ (answers: any) => {
        return answers.backend === 'In the cloud using Experitest' && answers.expEnvPort !== '80' && answers.expEnvPort !== '443'
    }
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'LT_USERNAME',
    when: /* istanbul ignore next */ (answers: any) => (
        answers.backend.indexOf('LambdaTest') > -1 &&
        answers.hostname.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'LT_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: any) => (
        answers.backend.indexOf('LambdaTest') > -1 &&
        answers.hostname.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'BROWSERSTACK_USER',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'BROWSERSTACK_ACCESSKEY',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.startsWith('In the cloud using Browserstack')
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'SAUCE_USERNAME',
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'SAUCE_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'confirm',
    name: 'headless',
    message: 'Do you want to run your test on Sauce Headless? (https://saucelabs.com/products/web-testing/sauce-headless)',
    default: false,
    when: /* istanbul ignore next */ (answers: any) => answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'list',
    name: 'region',
    message: 'In which region do you want to run your Sauce Labs tests in?',
    choices: [
        'us',
        'eu'
    ],
    when: /* istanbul ignore next */ (answers: any) => !answers.headless && answers.backend === 'In the cloud using Sauce Labs'
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the IP or URI to your Selenium standalone or grid server?',
    default: 'localhost',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port which your Selenium standalone or grid server is running on?',
    default: '4444',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'path',
    message: 'What is the path to your browser driver or grid server?',
    default: '/',
    when: /* istanbul ignore next */ (answers: any) => answers.backend.indexOf('own Selenium cloud') > -1
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
    when: /* istanbul ignore next */ (answers: any) => answers.framework.match(/(mocha|jasmine)/)
}, {
    type: 'input',
    name: 'specs',
    message: 'Where are your feature files located?',
    default: './features/**/*.feature',
    when: /* istanbul ignore next */ (answers: any) => answers.framework.includes('cucumber')
}, {
    type: 'input',
    name: 'stepDefinitions',
    message: 'Where are your step definitions located?',
    default: './features/step-definitions/steps.js',
    when: /* istanbul ignore next */ (answers: any) => answers.framework.includes('cucumber')
}, {
    type: 'confirm',
    name: 'generateTestFiles',
    message: 'Do you want WebdriverIO to autogenerate some test files?',
    default: true
}, {
    type: 'confirm',
    name: 'usePageObjects',
    message: 'Do you want to use page objects (https://martinfowler.com/bliki/PageObject.html)?',
    default: true,
    when: /* istanbul ignore next */ (answers: any) => answers.generateTestFiles
}, {
    type: 'input',
    name: 'pages',
    message: 'Where are your page objects located?',
    default: /* istanbul ignore next */ (answers: any) => (
        answers.framework.match(/(mocha|jasmine)/)
            ? './test/pageobjects/**/*.js'
            : './features/pageobjects/**/*.js'
    ),
    when: /* istanbul ignore next */ (answers: any) => answers.generateTestFiles && answers.usePageObjects
}, {
    type: 'list',
    name: 'isUsingCompiler',
    message: 'Are you using a compiler?',
    choices: Object.values(COMPILER_OPTIONS),
    default: /* istanbul ignore next */ () => hasFile('babel.config.js')
        ? COMPILER_OPTIONS.babel // default to Babel
        : hasFile('tsconfig.json')
            ? COMPILER_OPTIONS.ts // default to TypeScript
            : COMPILER_OPTIONS.nil // default to no compiler
}, {
    type: 'checkbox',
    name: 'reporters',
    message: 'Which reporter do you want to use?',
    choices: SUPPORTED_PACKAGES.reporter,
    // @ts-ignore
    default: [SUPPORTED_PACKAGES.reporter.find(
        /* istanbul ignore next */
        ({ name }) => name === 'spec').value
    ]
}, {
    type: 'checkbox',
    name: 'services',
    message: 'Do you want to add a service to your test setup?',
    choices: SUPPORTED_PACKAGES.service,
    // @ts-ignore
    default: [SUPPORTED_PACKAGES.service.find(
        /* istanbul ignore next */
        ({ name }) => name === 'chromedriver').value
    ],
    validate: /* istanbul ignore next */ (answers: any) => validateServiceAnswers(answers)
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the xunit reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: any) => answers.reporters.includes('junit')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: any) => answers.reporters.includes('json')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the mochawesome json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: any) => answers.reporters.includes('mochawesome')
}, {
    type: 'input',
    name: 'baseUrl',
    message: 'What is the base url?',
    default: 'http://localhost'
}]
