import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { HOOK_DEFINITION } from '@wdio/utils'
import type { Options, Services, Reporters, Capabilities } from '@wdio/types'

import {
    detectCompiler,
    getDefaultFiles,
    convertPackageHashToObject,
    getProjectRoot,
    detectPackageManager,
} from './utils.js'
import type { Questionnair } from './types.js'

const require = createRequire(import.meta.url)
export const pkg = require('../package.json')

export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${pkg.version})`

export const CONFIG_HELPER_INTRO = `
===============================
🤖 WDIO Configuration Wizard 🧙
===============================
`

export const PMs = ['npm', 'yarn', 'pnpm', 'bun'] as const
export const SUPPORTED_CONFIG_FILE_EXTENSION = ['js', 'ts', 'mjs', 'mts', 'cjs', 'cts']
export const configHelperSuccessMessage = ({ projectRootDir, runScript, extraInfo = '' }: { projectRootDir: string, runScript: string, extraInfo: string }) => `
🤖 Successfully setup project at ${ projectRootDir } 🎉

Join our Discord Community Server and instantly find answers to your issues or queries. Or just join and say hi 👋!
  🔗 https://discord.webdriver.io

Visit the project on GitHub to report bugs 🐛 or raise feature requests 💡:
  🔗 https://github.com/webdriverio/webdriverio
${ extraInfo }
To run your tests, execute:
$ cd ${ projectRootDir }
$ npm run ${ runScript }
`

export const CONFIG_HELPER_SERENITY_BANNER = `
Learn more about Serenity/JS:
  🔗 https://serenity-js.org
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

export enum CompilerOptions {
    Babel = 'Babel (https://babeljs.io/)',
    TS = 'TypeScript (https://www.typescriptlang.org/)',
    Nil = 'No!'
}

/**
 * We have to use a string hash for value because InquirerJS default values do not work if we have
 * objects as a `value` to be stored from the user's answers.
 */
export const SUPPORTED_PACKAGES = {
    runner: [
        { name: 'E2E Testing - of Web or Mobile Applications', value: '@wdio/local-runner$--$local$--$e2e' },
        { name: 'Component or Unit Testing - in the browser\n    > https://webdriver.io/docs/component-testing', value: '@wdio/browser-runner$--$browser$--$component' },
        { name: 'Desktop Testing - of Electron Applications\n    > https://webdriver.io/docs/desktop-testing/electron', value: '@wdio/local-runner$--$local$--$electron' },
        { name: 'Desktop Testing - of MacOS Applications\n    > https://webdriver.io/docs/desktop-testing/macos', value: '@wdio/local-runner$--$local$--$macos' },
        { name: 'VS Code Extension Testing\n    > https://webdriver.io/docs/vscode-extension-testing', value: '@wdio/local-runner$--$local$--$vscode' }
    ],
    framework: [
        { name: 'Mocha (https://mochajs.org/)', value: '@wdio/mocha-framework$--$mocha' },
        { name: 'Mocha with Serenity/JS (https://serenity-js.org/)', value: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha' },
        { name: 'Jasmine (https://jasmine.github.io/)', value: '@wdio/jasmine-framework$--$jasmine' },
        { name: 'Jasmine with Serenity/JS (https://serenity-js.org/)', value: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$jasmine' },
        { name: 'Cucumber (https://cucumber.io/)', value: '@wdio/cucumber-framework$--$cucumber' },
        { name: 'Cucumber with Serenity/JS (https://serenity-js.org/)', value: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$cucumber' },
    ],
    reporter: [
        { name: 'spec', value: '@wdio/spec-reporter$--$spec' },
        { name: 'dot', value: '@wdio/dot-reporter$--$dot' },
        { name: 'junit', value: '@wdio/junit-reporter$--$junit' },
        { name: 'allure', value: '@wdio/allure-reporter$--$allure' },
        { name: 'sumologic', value: '@wdio/sumologic-reporter$--$sumologic' },
        { name: 'concise', value: '@wdio/concise-reporter$--$concise' },
        { name: 'json', value: '@wdio/json-reporter$--$json' },
        // external
        { name: 'reportportal', value: 'wdio-reportportal-reporter$--$reportportal' },
        { name: 'video', value: 'wdio-video-reporter$--$video' },
        { name: 'cucumber-json', value: 'wdio-cucumberjs-json-reporter$--$cucumberjs-json' },
        { name: 'mochawesome', value: 'wdio-mochawesome-reporter$--$mochawesome' },
        { name: 'timeline', value: 'wdio-timeline-reporter$--$timeline' },
        { name: 'html-nice', value: 'wdio-html-nice-reporter$--$html-nice' },
        { name: 'slack', value: '@moroo/wdio-slack-reporter$--$slack' },
        { name: 'teamcity', value: 'wdio-teamcity-reporter$--$teamcity' },
        { name: 'delta', value: '@delta-reporter/wdio-delta-reporter-service$--$delta' },
        { name: 'testrail', value: '@wdio/testrail-reporter$--$testrail' },
        { name: 'light', value: 'wdio-light-reporter$--$light' }
    ],
    plugin: [
        { name: 'wait-for: utilities that provide functionalities to wait for certain conditions till a defined task is complete.\n   > https://www.npmjs.com/package/wdio-wait-for', value: 'wdio-wait-for$--$wait-for' },
        { name: 'angular-component-harnesses: support for Angular component test harnesses\n   > https://www.npmjs.com/package/@badisi/wdio-harness', value: '@badisi/wdio-harness$--$harness' },
        { name: 'Testing Library: utilities that encourage good testing practices laid down by dom-testing-library.\n   > https://testing-library.com/docs/webdriverio-testing-library/intro', value: '@testing-library/webdriverio$--$testing-library' }
    ],
    service: [
        // internal or community driver services
        { name: 'visual', value: '@wdio/visual-service$--$visual' },
        { name: 'vite', value: 'wdio-vite-service$--$vite' },
        { name: 'nuxt', value: 'wdio-nuxt-service$--$nuxt' },
        { name: 'firefox-profile', value: '@wdio/firefox-profile-service$--$firefox-profile' },
        { name: 'gmail', value: 'wdio-gmail-service$--$gmail' },
        { name: 'sauce', value: '@wdio/sauce-service$--$sauce' },
        { name: 'testingbot', value: '@wdio/testingbot-service$--$testingbot' },
        { name: 'crossbrowsertesting', value: '@wdio/crossbrowsertesting-service$--$crossbrowsertesting' },
        { name: 'browserstack', value: '@wdio/browserstack-service$--$browserstack' },
        { name: 'lighthouse', value: '@wdio/lighthouse-service$--$lighthouse' },
        { name: 'vscode', value: 'wdio-vscode-service$--$vscode' },
        { name: 'electron', value: 'wdio-electron-service$--$electron' },
        { name: 'appium', value: '@wdio/appium-service$--$appium' },
        // external
        { name: 'eslinter-service', value: 'wdio-eslinter-service$--$eslinter' },
        { name: 'lambdatest', value: 'wdio-lambdatest-service$--$lambdatest' },
        { name: 'zafira-listener', value: 'wdio-zafira-listener-service$--$zafira-listener' },
        { name: 'reportportal', value: 'wdio-reportportal-service$--$reportportal' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
        { name: 'ui5', value: 'wdio-ui5-service$--$ui5' },
        { name: 'wiremock', value: 'wdio-wiremock-service$--$wiremock' },
        { name: 'ng-apimock', value: 'wdio-ng-apimock-service$--$ng-apimock' },
        { name: 'slack', value: 'wdio-slack-service$--$slack' },
        { name: 'cucumber-viewport-logger', value: 'wdio-cucumber-viewport-logger-service$--$cucumber-viewport-logger' },
        { name: 'intercept', value: 'wdio-intercept-service$--$intercept' },
        { name: 'docker', value: 'wdio-docker-service$--$docker' },
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
        { name: 'vitaqai', value: 'wdio-vitaqai-service$--$vitaqai' },
        { name: 'robonut', value: 'wdio-robonut-service$--$robonut' },
        { name: 'qunit', value: 'wdio-qunit-service$--$qunit' }
    ]
}

export const SUPPORTED_BROWSER_RUNNER_PRESETS = [
    { name: 'Lit (https://lit.dev/)', value: '$--$' },
    { name: 'Vue.js (https://vuejs.org/)', value: '@vitejs/plugin-vue$--$vue' },
    { name: 'Svelte (https://svelte.dev/)', value: '@sveltejs/vite-plugin-svelte$--$svelte' },
    { name: 'SolidJS (https://www.solidjs.com/)', value: 'vite-plugin-solid$--$solid' },
    { name: 'StencilJS (https://stenciljs.com/)', value: '$--$stencil' },
    { name: 'React (https://reactjs.org/)', value: '@vitejs/plugin-react$--$react' },
    { name: 'Preact (https://preactjs.com/)', value: '@preact/preset-vite$--$preact' },
    { name: 'Other', value: false }
]

export const TESTING_LIBRARY_PACKAGES: Record<string, string> = {
    react: '@testing-library/react',
    preact: '@testing-library/preact',
    vue: '@testing-library/vue',
    svelte: '@testing-library/svelte',
    solid: 'solid-testing-library'
}

export enum BackendChoice {
    Local = 'On my local machine',
    Experitest = 'In the cloud using Experitest',
    Saucelabs = 'In the cloud using Sauce Labs',
    Browserstack = 'In the cloud using BrowserStack',
    OtherVendors = 'In the cloud using Testingbot or LambdaTest or a different service',
    Grid = 'I have my own Selenium cloud'
}

export enum ElectronBuildToolChoice {
    ElectronForge = 'Electron Forge (https://www.electronforge.io/)',
    ElectronBuilder = 'electron-builder (https://www.electron.build/)',
    SomethingElse = 'Something else'
}

enum ProtocolOptions {
    HTTPS = 'https',
    HTTP = 'http'
}

export enum RegionOptions {
    US = 'us',
    EU = 'eu',
    APAC = 'apac'
}

export const E2E_ENVIRONMENTS = [
    { name: 'Web - web applications in the browser', value: 'web' },
    { name: 'Mobile - native, hybrid and mobile web apps, on Android or iOS', value: 'mobile' }
]

export const MOBILE_ENVIRONMENTS = [
    { name: 'Android - native, hybrid and mobile web apps, tested on emulators and real devices\n    > using UiAutomator2 (https://www.npmjs.com/package/appium-uiautomator2-driver)', value: 'android' },
    { name: 'iOS - applications on iOS, iPadOS, and tvOS\n    > using XCTest (https://appium.github.io/appium-xcuitest-driver)', value: 'ios' }
]

export const BROWSER_ENVIRONMENTS = [
    { name: 'Chrome', value: 'chrome' },
    { name: 'Firefox', value: 'firefox' },
    { name: 'Safari', value: 'safari' },
    { name: 'Microsoft Edge', value: 'MicrosoftEdge' }
]

function isBrowserRunner (answers: Questionnair) {
    return answers.runner === SUPPORTED_PACKAGES.runner[1].value
}

export function usesSerenity (answers: Questionnair) {
    return answers.framework.includes('serenity-js')
}

function getTestingPurpose (answers: Questionnair) {
    return convertPackageHashToObject(answers.runner).purpose as 'e2e' | 'electron' | 'component' | 'vscode' | 'macos'
}

export const isNuxtProject = await Promise.all(
    [
        path.join(process.cwd(), 'nuxt.config.js'),
        path.join(process.cwd(), 'nuxt.config.ts'),
        path.join(process.cwd(), 'nuxt.config.mjs'),
        path.join(process.cwd(), 'nuxt.config.mts')
    ].map(
        (p) => fs.access(p).then(() => true, () => false)
    )
).then(
    (res) => res.some(Boolean),
    () => false
)

function selectDefaultService (serviceNames: string | string[]) {
    serviceNames = Array.isArray(serviceNames) ? serviceNames : [serviceNames]
    return SUPPORTED_PACKAGES.service
        /* istanbul ignore next */
        .filter(({ name }) => serviceNames.includes(name))
        .map(({ value }) => value)
}

function prioServiceOrderFor (serviceNamesParam: string | string[]) {
    const serviceNames = Array.isArray(serviceNamesParam) ? serviceNamesParam : [serviceNamesParam]
    let services = SUPPORTED_PACKAGES.service
    for (const serviceName of serviceNames) {
        const index = services.findIndex(({ name }) => name === serviceName)
        services = [services[index], ...services.slice(0, index), ...services.slice(index + 1)]
    }

    return services
}

export const QUESTIONNAIRE = [{
    type: 'list',
    name: 'runner',
    message: 'What type of testing would you like to do?',
    choices: SUPPORTED_PACKAGES.runner
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
    default: true,
    // only ask if there are more than 1 runner to pick from
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        isBrowserRunner(answers) &&
        /**
         * Only show if Testing Library has an add-on for framework
         */
        answers.preset && TESTING_LIBRARY_PACKAGES[convertPackageHashToObject(answers.preset!).short]
    )
}, {
    type: 'list',
    name: 'electronBuildTool',
    message: 'Which tool are you using to build your Electron app?',
    choices: Object.values(ElectronBuildToolChoice),
    when: /* instanbul ignore next */ (answers: Questionnair) => getTestingPurpose(answers) === 'electron'
}, {
    type: 'input',
    name: 'electronAppBinaryPath',
    message: 'What is the path to the binary of your built Electron app?',
    when: /* istanbul ignore next */ (answers: Questionnair) => getTestingPurpose(answers) === 'electron' && (answers.electronBuildTool === ElectronBuildToolChoice.SomethingElse)
}, {
    type: 'list',
    name: 'backend',
    message: 'Where is your automation backend located?',
    choices: Object.values(BackendChoice),
    when: /* instanbul ignore next */ (answers: Questionnair) => getTestingPurpose(answers) === 'e2e'
}, {
    type: 'list',
    name: 'e2eEnvironment',
    message: 'Which environment you would like to automate?',
    choices: E2E_ENVIRONMENTS,
    default: 'web',
    when: /* istanbul ignore next */ (answers: Questionnair) => getTestingPurpose(answers) === 'e2e'
}, {
    type: 'list',
    name: 'mobileEnvironment',
    message: 'Which mobile environment you\'ld like to automate?',
    choices: MOBILE_ENVIRONMENTS,
    when: /* instanbul ignore next */ (answers: Questionnair) => (
        getTestingPurpose(answers) === 'e2e' &&
        answers.e2eEnvironment === 'mobile'
    )
}, {
    type: 'checkbox',
    name: 'browserEnvironment',
    message: 'With which browser should we start?',
    choices: BROWSER_ENVIRONMENTS,
    default: ['chrome'],
    when: /* instanbul ignore next */ (answers: Questionnair) => (
        getTestingPurpose(answers) === 'e2e' &&
        answers.e2eEnvironment === 'web'
    )
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the host address of that cloud service?',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend && answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port on which that service is running?',
    default: '80',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend && answers.backend.indexOf('different service') > -1
}, {
    type: 'input',
    name: 'expEnvAccessKey',
    message: 'Access key from Experitest Cloud',
    default: 'EXPERITEST_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Experitest
}, {
    type: 'input',
    name: 'expEnvHostname',
    message: 'Environment variable for cloud url',
    default: 'example.experitest.com',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Experitest
}, {
    type: 'input',
    name: 'expEnvPort',
    message: 'Environment variable for port',
    default: '443',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Experitest
}, {
    type: 'list',
    name: 'expEnvProtocol',
    message: 'Choose a protocol for environment variable',
    default: ProtocolOptions.HTTPS,
    choices: Object.values(ProtocolOptions),
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend === BackendChoice.Experitest &&
        answers.expEnvPort !== '80' &&
        answers.expEnvPort !== '443'
    )
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'LT_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend && answers.backend.indexOf('LambdaTest') > -1 &&
        answers.hostname!.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'LT_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend && answers.backend.indexOf('LambdaTest') > -1 &&
        answers.hostname!.indexOf('lambdatest.com') > -1
    )
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'BROWSERSTACK_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Browserstack
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'BROWSERSTACK_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Browserstack
}, {
    type: 'input',
    name: 'env_user',
    message: 'Environment variable for username',
    default: 'SAUCE_USERNAME',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Saucelabs
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'SAUCE_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Saucelabs
}, {
    type: 'list',
    name: 'region',
    message: 'In which region do you want to run your Sauce Labs tests in?',
    choices: Object.values(RegionOptions),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend === BackendChoice.Saucelabs
}, {
    type: 'confirm',
    name: 'useSauceConnect',
    message: (
        'Are you testing a local application and need Sauce Connect to be set-up?\n' +
        'Read more on Sauce Connect at: https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy'
    ),
    default: isNuxtProject,
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend === BackendChoice.Saucelabs &&
        !isNuxtProject
    )
}, {
    type: 'input',
    name: 'hostname',
    message: 'What is the IP or URI to your Selenium standalone or grid server?',
    default: 'localhost',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend && answers.backend.toString().indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'port',
    message: 'What is the port which your Selenium standalone or grid server is running on?',
    default: '4444',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend && answers.backend.toString().indexOf('own Selenium cloud') > -1
}, {
    type: 'input',
    name: 'path',
    message: 'What is the path to your browser driver or grid server?',
    default: '/',
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.backend && answers.backend.toString().indexOf('own Selenium cloud') > -1
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
        /**
         * Serenity tests don't come with proper ElectronJS example files
         */
        if (getTestingPurpose(answers) === 'electron') {
            return SUPPORTED_PACKAGES.framework.filter(
                ({ value }) => !value.startsWith('@serenity-js')
            )
        }

        return SUPPORTED_PACKAGES.framework
    }
}, {
    type: 'list',
    name: 'isUsingCompiler',
    message: 'Do you want to use a compiler?',
    choices: (answers: Questionnair) => {
        /**
         * StencilJS only supports TypeScript
         */
        if (answers.preset && answers.preset.includes('stencil')) {
            return [CompilerOptions.TS]
        }
        return Object.values(CompilerOptions)
    },
    default: /* istanbul ignore next */ (answers: Questionnair) => detectCompiler(answers)
}, {
    type: 'confirm',
    name: 'generateTestFiles',
    message: 'Do you want WebdriverIO to autogenerate some test files?',
    default: true,
    when: /* istanbul ignore next */ (answers: Questionnair) => {
        /**
         * we only have examples for Mocha and Jasmine
         */
        if (['vscode', 'electron', 'macos'].includes(getTestingPurpose(answers)) && answers.framework.includes('cucumber')) {
            return false
        }
        return true
    }
}, {
    type: 'input',
    name: 'specs',
    message: 'What should be the location of your spec files?',
    default: /* istanbul ignore next */ (answers: Questionnair) => {
        const pattern = isBrowserRunner(answers) ? 'src/**/*.test' : 'test/specs/**/*'
        return getDefaultFiles(answers, pattern)
    },
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.framework.match(/(mocha|jasmine)/)
}, {
    type: 'input',
    name: 'specs',
    message: 'What should be the location of your feature files?',
    default: (answers: Questionnair) => getDefaultFiles(answers, 'features/**/*.feature'),
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && answers.framework.includes('cucumber')
}, {
    type: 'input',
    name: 'stepDefinitions',
    message: 'What should be the location of your step definitions?',
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
        !isBrowserRunner(answers) &&
        /**
         * and also not needed when running VS Code tests since the service comes with
         * its own page object implementation, nor when running Electron or MacOS tests
         */
        !['vscode', 'electron', 'macos'].includes(getTestingPurpose(answers)) &&
        /**
         * Serenity/JS generates Lean Page Objects by default, so there's no need to ask about it
         * See https://serenity-js.org/handbook/web-testing/page-objects-pattern/
         */
        !usesSerenity(answers)
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
    type: 'input',
    name: 'serenityLibPath',
    message: 'What should be the location of your Serenity/JS Screenplay Pattern library?',
    default: /* istanbul ignore next */ async (answers: Questionnair) => {
        const projectRootDir = await getProjectRoot(answers)
        const specsDir = path.resolve(projectRootDir, path.dirname(answers.specs || '').replace(/\*\*$/, ''))
        return path.resolve(specsDir, '..', 'serenity')
    },
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && usesSerenity(answers)
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
    type: 'confirm',
    name: 'includeVisualTesting',
    message: 'Would you like to include Visual Testing to your setup? For more information see https://webdriver.io/docs/visual-testing!',
    default: false,
    when: /* istanbul ignore next */ (answers: Questionnair) => {
        /**
         * visual testing mostly makes sense for e2e and component tests
         */
        return ['e2e', 'component'].includes(getTestingPurpose(answers))
    }
}, {
    type: 'checkbox',
    name: 'services',
    message: 'Do you want to add a service to your test setup?',
    choices: (answers: Questionnair) => {
        const services: string[] = []
        if (answers.backend === BackendChoice.Browserstack) {
            services.push('browserstack')
        } else if (answers.backend === BackendChoice.Saucelabs) {
            services.push('sauce')
        }
        if (answers.e2eEnvironment === 'mobile') {
            services.push('appium')
        }
        if (getTestingPurpose(answers) === 'e2e' && isNuxtProject) {
            services.push('nuxt')
        }

        if (getTestingPurpose(answers) === 'vscode') {
            return [SUPPORTED_PACKAGES.service.find(({ name }) => name === 'vscode')]
        } else if (getTestingPurpose(answers) === 'electron') {
            return [SUPPORTED_PACKAGES.service.find(({ name }) => name === 'electron')]
        } else if (getTestingPurpose(answers) === 'macos') {
            return [SUPPORTED_PACKAGES.service.find(({ name }) => name === 'appium')]
        }
        return prioServiceOrderFor(services)
    },
    default: (answers: Questionnair) => {
        const defaultServices: string[] = []
        if (answers.backend === BackendChoice.Browserstack) {
            defaultServices.push('browserstack')
        } else if (answers.backend === BackendChoice.Saucelabs) {
            defaultServices.push('sauce')
        }
        if (answers.e2eEnvironment === 'mobile' || getTestingPurpose(answers) === 'macos') {
            defaultServices.push('appium')
        }
        if (getTestingPurpose(answers) === 'vscode') {
            defaultServices.push('vscode')
        } else if (getTestingPurpose(answers) === 'electron') {
            defaultServices.push('electron')
        }
        if (isNuxtProject) {
            defaultServices.push('nuxt')
        }
        if (answers.includeVisualTesting) {
            defaultServices.push('visual')
        }
        return selectDefaultService(defaultServices)
    }
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
    type: 'confirm',
    name: 'npmInstall',
    message: () => `Do you want me to run \`${detectPackageManager()} install\``,
    default: true
}]

const SUPPORTED_SNAPSHOTSTATE_OPTIONS = ['all', 'new', 'none'] as const
export const COMMUNITY_PACKAGES_WITH_TS_SUPPORT = [
    'wdio-electron-service',
    'wdio-vscode-service',
    'wdio-nuxt-service',
    'wdio-vite-service',
    'wdio-gmail-service'
]

export const TESTRUNNER_DEFAULTS: Options.Definition<Options.Testrunner> = {
    /**
     * Define specs for test execution. You can either specify a glob
     * pattern to match multiple files at once or wrap a glob or set of
     * paths into an array to run them within a single worker process.
     */
    specs: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "specs" option needs to be a list of strings')
            }
        }
    },
    /**
     * exclude specs from test execution
     */
    exclude: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "exclude" option needs to be a list of strings')
            }
        }
    },
    /**
     * key/value definition of suites (named by key) and a list of specs as value
     * to specify a specific set of tests to execute
     */
    suites: {
        type: 'object'
    },
    /**
     * Project root directory path.
     */
    rootDir: {
        type: 'string'
    },
    /**
     * If you only want to run your tests until a specific amount of tests have failed use
     * bail (default is 0 - don't bail, run all tests).
     */
    bail: {
        type: 'number',
        default: 0
    },
    /**
     * supported test framework by wdio testrunner
     */
    framework: {
        type: 'string'
    },
    /**
     * capabilities of WebDriver sessions
     */
    capabilities: {
        type: 'object',
        validate: (param: Capabilities.RemoteCapabilities) => {
            /**
             * should be an object
             */
            if (!Array.isArray(param)) {
                if (typeof param === 'object') {
                    return true
                }

                throw new Error('the "capabilities" options needs to be an object or a list of objects')
            }

            /**
             * or an array of objects
             */
            for (const option of param) {
                if (typeof option === 'object') { // Check does not work recursively
                    continue
                }

                throw new Error('expected every item of a list of capabilities to be of type object')
            }

            return true
        },
        required: true
    },
    /**
     * list of reporters to use, a reporter can be either a string or an object with
     * reporter options, e.g.:
     * [
     *  'dot',
     *  {
     *    name: 'spec',
     *    outputDir: __dirname + '/reports'
     *  }
     * ]
     */
    reporters: {
        type: 'object',
        validate: (param: Reporters.ReporterEntry[]) => {
            /**
             * option must be an array
             */
            if (!Array.isArray(param)) {
                throw new Error('the "reporters" options needs to be a list of strings')
            }

            const isValidReporter = (option: string | Function) => (
                (typeof option === 'string') ||
                (typeof option === 'function')
            )

            /**
             * array elements must be:
             */
            for (const option of param) {
                /**
                 * either a string or a function (custom reporter)
                 */
                if (isValidReporter(option as string)) {
                    continue
                }

                /**
                 * or an array with the name of the reporter as first element and the options
                 * as second element
                 */
                if (
                    Array.isArray(option) &&
                    typeof option[1] === 'object' &&
                    isValidReporter(option[0])
                ) {
                    continue
                }

                throw new Error(
                    'a reporter should be either a string in the format "wdio-<reportername>-reporter" ' +
                    'or a function/class. Please see the docs for more information on custom reporters ' +
                    '(https://webdriver.io/docs/customreporter)'
                )
            }

            return true
        }
    },
    /**
     * set of WDIO services to use
     */
    services: {
        type: 'object',
        validate: (param: Services.ServiceEntry[]) => {
            /**
             * should be an array
             */
            if (!Array.isArray(param)) {
                throw new Error('the "services" options needs to be a list of strings and/or arrays')
            }

            /**
             * with arrays and/or strings
             */
            for (const option of param) {
                if (!Array.isArray(option)) {
                    if (typeof option === 'string') {
                        continue
                    }
                    throw new Error('the "services" options needs to be a list of strings and/or arrays')
                }
            }

            return true
        },
        default: []
    },
    /**
     * Node arguments to specify when launching child processes
     */
    execArgv: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "execArgv" options needs to be a list of strings')
            }
        },
        default: []
    },
    /**
     * amount of instances to be allowed to run in total
     */
    maxInstances: {
        type: 'number'
    },
    /**
     * amount of instances to be allowed to run per capability
     */
    maxInstancesPerCapability: {
        type: 'number'
    },
    /**
     * whether or not testrunner should inject `browser`, `$` and `$$` as
     * global environment variables
     */
    injectGlobals: {
        type: 'boolean'
    },
    /**
     * Set to true if you want to update your snapshots.
     */
    updateSnapshots: {
        type: 'string',
        default: SUPPORTED_SNAPSHOTSTATE_OPTIONS[1],
        validate: (param: Options.Testrunner['updateSnapshots']) => {
            if (param && !SUPPORTED_SNAPSHOTSTATE_OPTIONS.includes(param)) {
                throw new Error(`the "updateSnapshots" options needs to be one of "${SUPPORTED_SNAPSHOTSTATE_OPTIONS.join('", "')}"`)
            }
        }
    },
    /**
     * Overrides default snapshot path. For example, to store snapshots next to test files.
     */
    resolveSnapshotPath: {
        type: 'function',
        validate: (param: Options.Testrunner['resolveSnapshotPath']) => {
            if (param && typeof param !== 'function') {
                throw new Error('the "resolveSnapshotPath" options needs to be a function')
            }
        }
    },
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: {
        type: 'number',
        default: 0
    },
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: {
        type: 'number',
        default: 0
    },
    /**
     * Whether or not retried spec files should be retried immediately or deferred to the end of the queue
     */
    specFileRetriesDeferred: {
        type: 'boolean',
        default: true
    },
    /**
     * whether or not print the log output grouped by test files
     */
    groupLogsByTestSpec: {
        type: 'boolean',
        default: false
    },
    /**
     * list of strings to watch of `wdio` command is called with `--watch` flag
     */
    filesToWatch: {
        type: 'object',
        validate: (param: string[]) => {
            if (!Array.isArray(param)) {
                throw new Error('the "filesToWatch" option needs to be a list of strings')
            }
        }
    },
    shard: {
        type: 'object',
        validate: (param: unknown) => {
            if (typeof param !== 'object') {
                throw new Error('the "shard" options needs to be an object')
            }

            const p = param as { current: number, total: number }
            if (typeof p.current !== 'number' || typeof p.total !== 'number') {
                throw new Error('the "shard" option needs to have "current" and "total" properties with number values')
            }

            if (p.current < 0 || p.current > p.total) {
                throw new Error('the "shard.current" value has to be between 0 and "shard.total"')
            }
        }
    },

    /**
     * hooks
     */
    onPrepare: HOOK_DEFINITION,
    onWorkerStart: HOOK_DEFINITION,
    onWorkerEnd: HOOK_DEFINITION,
    before: HOOK_DEFINITION,
    beforeSession: HOOK_DEFINITION,
    beforeSuite: HOOK_DEFINITION,
    beforeHook: HOOK_DEFINITION,
    beforeTest: HOOK_DEFINITION,
    afterTest: HOOK_DEFINITION,
    afterHook: HOOK_DEFINITION,
    afterSuite: HOOK_DEFINITION,
    afterSession: HOOK_DEFINITION,
    after: HOOK_DEFINITION,
    onComplete: HOOK_DEFINITION,
    onReload: HOOK_DEFINITION,
    beforeAssertion: HOOK_DEFINITION,
    afterAssertion: HOOK_DEFINITION
}

export const WORKER_GROUPLOGS_MESSAGES = {
    normalExit: (cid: string) => `\n***** List of steps of WorkerID=[${cid}] *****`,
    exitWithError: (cid: string) => `\n***** List of steps of WorkerID=[${cid}] that preceded the error above *****`
}
