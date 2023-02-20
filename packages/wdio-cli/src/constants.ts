import { createRequire } from 'node:module'

import { validateServiceAnswers, detectCompiler, getDefaultFiles, convertPackageHashToObject } from './utils.js'
import type { Questionnair } from './types.js'

const require = createRequire(import.meta.url)
export const pkg = require('../package.json')

export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${pkg.version})`

export const EXCLUSIVE_SERVICES = {
    'wdio-chromedriver-service': {
        services: ['@wdio/selenium-standalone-service'],
        message: '@wdio/selenium-standalone-service already includes chromedriver'
    }
}

export const CONFIG_HELPER_INTRO = `
===============================
🤖 WDIO Configuration Wizard 🧙
===============================
`

export const CONFIG_HELPER_SUCCESS_MESSAGE = `
🤖 Successfully setup project at %s 🎉

Join our Matrix community and instantly find answers to your issues or queries. Or just join and say hi 👋!
  🔗 https://matrix.to/#/#webdriver.io:gitter.im

Visit the project on GitHub to report bugs 🐛 or raise feature requests 💡:
  🔗 https://github.com/webdriverio/webdriverio

To run your tests, execute:
$ cd %s
$ npm run wdio
`

export const DEPENDENCIES_INSTALLATION_MESSAGE = `
To install dependencies, execute:
%s
`

export const NPM_INSTALL = ''

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

export const COMPILER_OPTION_ANSWERS = [
    'Babel (https://babeljs.io/)',
    'TypeScript (https://www.typescriptlang.org/)',
    'No!'
] as const

export const COMPILER_OPTIONS = {
    babel: COMPILER_OPTION_ANSWERS[0],
    ts: COMPILER_OPTION_ANSWERS[1],
    nil: COMPILER_OPTION_ANSWERS[2]
} as const

/**
 * We have to use a string hash for value because InquirerJS default values do not work if we have
 * objects as a `value` to be stored from the user's answers.
 */
export const SUPPORTED_PACKAGES = {
    runner: [
        { name: 'local - for e2e testing of web and mobile applications', value: '@wdio/local-runner$--$local' },
        { name: 'browser - for unit and component testing in the browser', value: '@wdio/browser-runner$--$browser' }
    ],
    framework: [
        { name: 'Mocha (https://mochajs.org/)', value: '@wdio/mocha-framework$--$mocha' },
        { name: 'Jasmine (https://jasmine.github.io/)', value: '@wdio/jasmine-framework$--$jasmine' },
        { name: 'Cucumber (https://cucumber.io/)', value: '@wdio/cucumber-framework$--$cucumber' }
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
        { name: 'cucumber-json', value: 'wdio-cucumberjs-json-reporter$--$cucumberjs-json' },
        { name: 'mochawesome', value: 'wdio-mochawesome-reporter$--$mochawesome' },
        { name: 'timeline', value: 'wdio-timeline-reporter$--$timeline' },
        { name: 'html-nice', value: 'wdio-html-nice-reporter$--$html-nice' },
        { name: 'slack', value: '@moroo/wdio-slack-reporter$--$slack' },
        { name: 'teamcity', value: 'wdio-teamcity-reporter$--$teamcity' },
        { name: 'delta', value: '@delta-reporter/wdio-delta-reporter-service' },
        { name: 'testrail', value: '@wdio/testrail-reporter$--$testrail' },
        { name: 'light', value: 'wdio-light-reporter--$light' }
    ],
    plugin: [
        { name: 'wait-for', value: 'wdio-wait-for$--$wait-for' },
        { name: 'angular-component-harnesses', value: '@badisi/wdio-harness$--$harness' }
    ],
    service: [
        // inquirerjs shows list as its orderer in array
        // put chromedriver first as it is the default option
        { name: 'chromedriver', value: 'wdio-chromedriver-service$--$chromedriver' },
        { name: 'geckodriver', value: 'wdio-geckodriver-service$--$geckodriver' },
        { name: 'edgedriver', value: 'wdio-edgedriver-service$--$edgedriver' },
        { name: 'safaridriver', value: 'wdio-safaridriver-service$--$safaridriver' },
        // internal
        { name: 'selenium-standalone', value: '@wdio/selenium-standalone-service$--$selenium-standalone' },
        { name: 'appium', value: '@wdio/appium-service$--$appium' },
        { name: 'vscode', value: 'wdio-vscode-service$--$vscode' },
        { name: 'electron', value: 'wdio-electron-service$--$electron' },
        { name: 'devtools', value: '@wdio/devtools-service$--$devtools' },
        { name: 'sauce', value: '@wdio/sauce-service$--$sauce' },
        { name: 'testingbot', value: '@wdio/testingbot-service$--$testingbot' },
        { name: 'crossbrowsertesting', value: '@wdio/crossbrowsertesting-service$--$crossbrowsertesting' },
        { name: 'browserstack', value: '@wdio/browserstack-service$--$browserstack' },
        { name: 'firefox-profile', value: '@wdio/firefox-profile-service$--$firefox-profile' },
        { name: 'gmail', value: '@wdio/gmail-service$--$gmail' },
        // external
        { name: 'eslinter-service', value: 'wdio-eslinter-service$--$eslinter' },
        { name: 'lambdatest', value: 'wdio-lambdatest-service$--$lambdatest' },
        { name: 'zafira-listener', value: 'wdio-zafira-listener-service$--$zafira-listener' },
        { name: 'reportportal', value: 'wdio-reportportal-service$--$reportportal' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'ui5', value: 'wdio-ui5-service$--$ui5' },
        { name: 'wiremock', value: 'wdio-wiremock-service$--$wiremock' },
        { name: 'ng-apimock', value: 'wdio-ng-apimock-service$--ng-apimock' },
        { name: 'slack', value: 'wdio-slack-service$--$slack' },
        { name: 'cucumber-viewport-logger', value: 'wdio-cucumber-viewport-logger-service$--$cucumber-viewport-logger' },
        { name: 'intercept', value: 'wdio-intercept-service$--$intercept' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'image-comparison', value: 'wdio-image-comparison-service$--$image-comparison' },
        { name: 'novus-visual-regression', value: 'wdio-novus-visual-regression-service$--$novus-visual-regression' },
        { name: 'rerun', value: 'wdio-rerun-service$--$rerun' },
        { name: 'winappdriver', value: 'wdio-winappdriver-service$--$winappdriver' },
        { name: 'ywinappdriver', value: 'wdio-ywinappdriver-service$--$ywinappdriver' },
        { name: 'performancetotal', value: 'wdio-performancetotal-service$--$performancetotal' },
        { name: 'cleanuptotal', value: 'wdio-cleanuptotal-service$--$cleanuptotal' },
        { name: 'aws-device-farm', value: 'wdio-aws-device-farm-service$--$aws-device-farm' },
        { name: 'ocr-native-apps', value: 'wdio-ocr-service$--$ocr-native-apps' },
        { name: 'ms-teams', value: 'wdio-ms-teams-service$--$ms-teams' },
        { name: 'tesults', value: 'wdio-tesults-service$--$tesults' },
        { name: 'azure-devops', value: '@gmangiapelo/wdio-azure-devops-service$--$azure-devops' },
        { name: 'google-Chat', value: 'wdio-google-chat-service$--$google-chat' },
        { name: 'qmate-service', value: '@sap_oss/wdio-qmate-service$--$qmate-service' },
        { name: 'vitaqai', value: 'wdio-vitaqai-service$--$vitaqai' }
    ]
} as const

export const SUPPORTED_BROWSER_RUNNER_PRESETS = [
    { name: 'Lit (https://lit.dev/)', value: '' },
    { name: 'Vue.js (https://vuejs.org/)', value: '@vitejs/plugin-vue$--$vue' },
    { name: 'Svelte (https://svelte.dev/)', value: '@sveltejs/vite-plugin-svelte$--$svelte' },
    { name: 'SolidJS (https://www.solidjs.com/)', value: 'vite-plugin-solid$--$solid' },
    { name: 'React (https://reactjs.org/)', value: '@vitejs/plugin-react$--$react' },
    { name: 'Preact (https://preactjs.com/)', value: '@preact/preset-vite$--$preact' },
    { name: 'Other', value: '' }
]

export const TESTING_LIBRARY_PACKAGES: Record<string, string> = {
    react: '@testing-library/react',
    preact: '@testing-library/preact',
    vue: '@testing-library/vue',
    svelte: '@testing-library/svelte'
}

export const BACKEND_CHOICES = [
    'On my local machine',
    'In the cloud using Experitest',
    'In the cloud using Sauce Labs',
    'In the cloud using BrowserStack',
    'In the cloud using Testingbot or LambdaTest or a different service',
    'I have my own Selenium cloud'
] as const

export const PROTOCOL_OPTIONS = [
    'https',
    'http'
] as const

export const REGION_OPTION = [
    'us',
    'eu',
    'apac'
] as const

function isBrowserRunner (answers: Questionnair) {
    return answers.runner === SUPPORTED_PACKAGES.runner[1].value
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
    name: 'preset',
    message: 'Which framework do you use for building components?',
    choices: SUPPORTED_BROWSER_RUNNER_PRESETS,
    // only ask if there are more than 1 runner to pick from
    when: /* istanbul ignore next */ isBrowserRunner
}, {
    type: 'confirm',
    name: 'installTestingLibrary',
    message: 'Do you like to use Testing Library (https://testing-library.com/) as test utility?',
    default: false,
    // only ask if there are more than 1 runner to pick from
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        isBrowserRunner(answers) &&
        /**
         * Only show if Testing Library has an add-on for framework
         */
        TESTING_LIBRARY_PACKAGES[convertPackageHashToObject(answers.preset!).short]
    )
}, {
    type: 'list',
    name: 'backend',
    message: 'Where is your automation backend located?',
    choices: /* instanbul ignore next */ (answers: Questionnair) => {
        /**
         * browser runner currently supports only local testing
         * until we have tunnel support for other cloud vendors
         */
        if (isBrowserRunner(answers)) {
            return BACKEND_CHOICES.slice(0, 1)
        }
        return BACKEND_CHOICES
    }
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the host address of that cloud service?',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend.toString().indexOf('different service') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port on which that service is running?',
    default: '80',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend.toString().indexOf('different service') > -1
}, {
    type: 'input',
    name: 'expEnvAccessKey',
    message: 'Access key from Experitest Cloud',
    default: 'EXPERITEST_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[1]
}, {
    type: 'input',
    name: 'expEnvHostname',
    message: 'Environment variable for cloud url',
    default: 'example.experitest.com',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[1]
}, {
    type: 'input',
    name: 'expEnvPort',
    message: 'Environment variable for port',
    default: '443',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[1]
}, {
    type: 'list',
    name: 'expEnvProtocol',
    message: 'Choose a protocol for environment variable',
    default: 'https',
    choices: PROTOCOL_OPTIONS,
    when: /* istanbul ignore next */ (answers: Questionnair) => {
        return answers.backend === BACKEND_CHOICES[1] && answers.expEnvPort !== '80' && answers.expEnvPort !== '443'
    }
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'LT_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend.toString().indexOf('LambdaTest') > -1 &&
        answers.hostname!.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'LT_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend.toString().indexOf('LambdaTest') > -1 &&
        answers.hostname!.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'BROWSERSTACK_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[3]
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'BROWSERSTACK_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[3]
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'SAUCE_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[2]
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'SAUCE_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[2]
}, {
    type: 'list',
    name: 'region',
    message: 'In which region do you want to run your Sauce Labs tests in?',
    choices: REGION_OPTION,
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BACKEND_CHOICES[2]
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the IP or URI to your Selenium standalone or grid server?',
    default: 'localhost',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend.toString().indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port which your Selenium standalone or grid server is running on?',
    default: '4444',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend.toString().indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'path',
    message: 'What is the path to your browser driver or grid server?',
    default: '/',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend.toString().indexOf('own Selenium cloud') > -1
}, {
    type: 'list',
    name: 'framework',
    message: 'Which framework do you want to use?',
    choices: /* instanbul ignore next */ (answers: Questionnair) => {
        /**
         * browser runner currently supports only Mocha framework
         */
        if (isBrowserRunner(answers)) {
            return SUPPORTED_PACKAGES.framework.slice(0, 1)
        }
        return SUPPORTED_PACKAGES.framework
    }
}, {
    type: 'list',
    name: 'isUsingCompiler',
    message: 'Do you want to use a compiler?',
    choices: COMPILER_OPTION_ANSWERS,
    default: /* istanbul ignore next */ (answers: Questionnair) => detectCompiler(answers)
}, {
    type: 'confirm',
    name: 'generateTestFiles',
    message: 'Do you want WebdriverIO to autogenerate some test files?',
    default: true
}, {
    type: 'input',
    name: 'specs',
    message: 'Where should these files be located?',
    default: /* istanbul ignore next */ (answers: Questionnair) => getDefaultFiles(answers, 'test/specs/**/*'),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.framework.match(/(mocha|jasmine)/)
}, {
    type: 'input',
    name: 'specs',
    message: 'Where should these feature files be located?',
    default: (answers: Questionnair) => getDefaultFiles(answers, 'features/**/*.feature'),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.framework.includes('cucumber')
}, {
    type: 'input',
    name: 'stepDefinitions',
    message: 'Where should these step definitions be located?',
    default: (answers: Questionnair) => getDefaultFiles(answers, 'features/step-definitions/steps'),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.framework.includes('cucumber')
}, {
    type: 'confirm',
    name: 'usePageObjects',
    message: 'Do you want to use page objects (https://martinfowler.com/bliki/PageObject.html)?',
    default: true,
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.generateTestFiles &&
        /**
         * page objects aren't common for component testing
         */
        !isBrowserRunner(answers)
    )
}, {
    type: 'input',
    name: 'pages',
    message: 'Where are your page objects located?',
    default: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.framework.match(/(mocha|jasmine)/)
            ? getDefaultFiles(answers, 'test/pageobjects/**/*')
            : getDefaultFiles(answers, 'features/pageobjects/**/*')
    ),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.usePageObjects
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
    name: 'plugins',
    message: 'Do you want to add a plugin to your test setup?',
    choices: SUPPORTED_PACKAGES.plugin,
    default: []
}, {
    type: 'checkbox',
    name: 'services',
    message: 'Do you want to add a service to your test setup?',
    choices: (answers: Questionnair) => {
        if (answers.backend === BACKEND_CHOICES[3]) {
            const index = SUPPORTED_PACKAGES.service.findIndex(({ name }) => name === 'browserstack')
            return SUPPORTED_PACKAGES.service.slice(index)
                .concat(SUPPORTED_PACKAGES.service.slice(0, index))
        } else if (answers.backend === BACKEND_CHOICES[2]) {
            const index = SUPPORTED_PACKAGES.service.findIndex(({ name }) => name ==='sauce')
            return SUPPORTED_PACKAGES.service.slice(index)
                .concat(SUPPORTED_PACKAGES.service.slice(0, index))
        }
        return SUPPORTED_PACKAGES.service
    },
    // @ts-ignore
    default: (answers: Questionnair) => {
        if (answers.backend === BACKEND_CHOICES[3]) {
            return [SUPPORTED_PACKAGES.service.find(
                /* istanbul ignore next */
                ({ name }) => name === 'browserstack')?.value]
        } else if (answers.backend === BACKEND_CHOICES[2]) {
            return [SUPPORTED_PACKAGES.service.find(
                /* istanbul ignore next */
                ({ name }) => name === 'sauce')?.value]
        }
        return [SUPPORTED_PACKAGES.service.find(
        /* istanbul ignore next */
            ({ name }) => name === 'chromedriver')?.value]
    },
    validate: /* istanbul ignore next */ (answers: string[]) => validateServiceAnswers(answers)
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the xunit reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.reporters.includes('junit')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.reporters.includes('json')
}, {
    type: 'input',
    name: 'outputDir',
    message: 'In which directory should the mochawesome json reports get stored?',
    default: './',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.reporters.includes('mochawesome')
}, {
    type: 'input',
    name: 'baseUrl',
    message: 'What is the base url?',
    default: 'http://localhost',
    // no base url for browser tests
    when: /* istanbul ignore next */ (answers: Questionnair) => !isBrowserRunner(answers)
}, {
    type: 'confirm',
    name: 'npmInstall',
    message: 'Do you want me to run `npm install`',
    default: true
}]
