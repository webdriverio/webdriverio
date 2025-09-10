import { convertPackageHashToObject, detectPackageManager, getDefaultFiles, detectCompiler, getProjectRoot } from './utils.js'
import pkg from '../package.json' with { type:'json' }
import path from 'node:path'
import fs from 'node:fs'
import type { Questionnair } from './types.js'
import chalk from 'chalk'

export { pkg }

export const colorItBold = chalk.bold.rgb(234, 89, 6)
export const colorIt = chalk.rgb(234, 89, 6)
export type PACKAGE_MANAGER = 'npm' | 'pnpm' | 'yarn' | 'bun'

export const DEFAULT_NPM_TAG = 'latest'
export const ASCII_ROBOT = `
                 -:...........................-:.
                 +                              +
              \`\` +      \`...\`        \`...\`      + \`
            ./+/ +    .:://:::\`    \`::///::\`  \` + ++/.
           .+oo+ +    /:+ooo+-/    /-+ooo+-/ ./ + +oo+.
           -ooo+ +    /-+ooo+-/    /-+ooo+-/ .: + +ooo.
            -+o+ +    \`::///:-\`    \`::///::\`    + +o+-
             \`\`. /.     \`\`\`\`\`        \`\`\`\`\`     .: .\`\`
                  .----------------------------.
           \`-::::::::::::::::::::::::::::::::::::::::-\`
          .+oooo/:------------------------------:/oooo+.
      \`.--/oooo-                                  :oooo/--.\`
    .::-\`\`:oooo\`                                  .oooo-\`\`-::.
  ./-\`    -oooo\`--.: :.--                         .oooo-    \`-/.
 -/\`    \`-/oooo////////////////////////////////////oooo/.\`    \`/-
\`+\`   \`/+oooooooooooooooooooooooooooooooooooooooooooooooo+:\`   .+\`
-/    +o/.:oooooooooooooooooooooooooooooooooooooooooooo:-/o/    +.
-/   .o+  -oooosoooososssssooooo------------------:oooo- \`oo\`   +.
-/   .o+  -oooodooohyyssosshoooo\`                 .oooo-  oo.   +.
-/   .o+  -oooodooysdooooooyyooo\` \`.--.\`\`     .:::-oooo-  oo.   +.
-/   .o+  -oooodoyyodsoooooyyooo.//-..-:/:.\`.//.\`./oooo-  oo.   +.
-/   .o+  -oooohsyoooyysssysoooo+-\`     \`-:::.    .oooo-  oo.   +.
-/   .o+  -ooooosooooooosooooooo+//////////////////oooo-  oo.   +.
-/   .o+  -oooooooooooooooooooooooooooooooooooooooooooo-  oo.   +.
-/   .o+  -oooooooooooooooooooooooooooooooooooooooooooo-  oo.   +.
-+////o+\` -oooo---:///:----://::------------------:oooo- \`oo////+-
+ooooooo/\`-oooo\`\`:-\`\`\`.:\`.:.\`.+/-    .::::::::::\` .oooo-\`+ooooooo+
oooooooo+\`-oooo\`-- \`/\` .:+  -/-\`/\`   .::::::::::  .oooo-.+oooooooo
+-/+://-/ -oooo-\`:\`.o-\`:.:-\`\`\`\`.:    .///:\`\`\`\`\`\`  -oooo-\`/-//:+:-+
: :..--:-:.+ooo+/://o+/-.-:////:-....-::::-....--/+ooo+.:.:--.-- /
- /./\`-:-\` .:///+/ooooo/+///////////////+++ooooo/+///:. .-:.\`+./ :
:-:/.           :\`ooooo\`/\`              .:.ooooo :           ./---
                :\`ooooo\`/\`              .:.ooooo :
                :\`ooooo./\`              .:-ooooo :
                :\`ooooo./\`              .:-ooooo :
            \`...:-+++++:/.              ./:+++++-:...\`
           :-.\`\`\`\`\`\`\`\`/../              /.-:\`\`\`\`\`\`\`\`.:-
          -/::::::::://:/+             \`+/:+::::::::::+.
          :oooooooooooo++/              +++oooooooooooo-
`

export const PROGRAM_TITLE = `
                           ${colorItBold('Webdriver.IO')}
              ${colorIt('Next-gen browser and mobile automation')}
                    ${colorIt('test framework for Node.js')}
`

export const UNSUPPORTED_NODE_VERSION = (
    '⚠️  Unsupported Node.js Version Error ⚠️\n' +
    `You are using Node.js ${process.version} which is too old to be used with WebdriverIO.\n` +
    'Please update to Node.js v20 to continue.\n'
)

export const INSTALL_COMMAND: Record<PACKAGE_MANAGER, string> = {
    npm: 'install',
    pnpm: 'add',
    yarn: 'add',
    bun: 'install'
} as const

export const EXECUTER: Record<PACKAGE_MANAGER, string> = {
    npm: 'npx',
    pnpm: 'pnpm',
    yarn: 'yarn',
    bun: 'bunx'
} as const

export const EXECUTE_COMMAND: Record<PACKAGE_MANAGER, string> = {
    npm: '',
    pnpm: 'exec',
    yarn: 'exec',
    bun: ''
} as const

export const DEV_FLAG: Record<PACKAGE_MANAGER, string> = {
    npm: '--save-dev',
    pnpm: '--save-dev',
    yarn: '--dev',
    bun: '--dev'
} as const

export const SUPPORTED_PACKAGE_MANAGERS = Object.keys(INSTALL_COMMAND) as PACKAGE_MANAGER[]
// transport from
export const CONFIG_HELPER_INTRO = `
===============================
🤖 WDIO Configuration Wizard 🧙
===============================
`

export const CLI_EPILOGUE = `Documentation: https://webdriver.io\n@wdio/cli (v${pkg.version})`

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
        { name: 'VS Code Extension Testing\n    > https://webdriver.io/docs/vscode-extension-testing', value: '@wdio/local-runner$--$local$--$vscode' },
        { name: 'Roku Testing - of OTT apps running on RokuOS\n    > https://webdriver.io/docs/wdio-roku-service', value: '@wdio/local-runner$--$local$--$roku' }
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
        { name: 'spec', value: '@wdio/spec-reporter$--$spec', checked: true },
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
        { name: 'light', value: 'wdio-light-reporter$--$light' },
        { name: 'wdio-json-html-reporter', value: 'wdio-json-html-reporter$--$jsonhtml' }
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
        { name: 'browserstack', value: '@wdio/browserstack-service$--$browserstack' },
        { name: 'lighthouse', value: '@wdio/lighthouse-service$--$lighthouse' },
        { name: 'vscode', value: 'wdio-vscode-service$--$vscode' },
        { name: 'electron', value: 'wdio-electron-service$--$electron' },
        { name: 'appium', value: '@wdio/appium-service$--$appium' },
        // external
        { name: 'eslinter-service', value: 'wdio-eslinter-service$--$eslinter' },
        { name: 'lambdatest', value: 'wdio-lambdatest-service$--$lambdatest' },
        { name: 'tvlabs', value: '@tvlabs/wdio-service$--$tvlabs' },
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
        { name: 'ms-teams', value: 'wdio-ms-teams-service$--$ms-teams' },
        { name: 'tesults', value: 'wdio-tesults-service$--$tesults' },
        { name: 'azure-devops', value: '@gmangiapelo/wdio-azure-devops-service$--$azure-devops' },
        { name: 'google-Chat', value: 'wdio-google-chat-service$--$google-chat' },
        { name: 'qmate-service', value: '@sap_oss/wdio-qmate-service$--$qmate-service' },
        { name: 'robonut', value: 'wdio-robonut-service$--$robonut' },
        { name: 'qunit', value: 'wdio-qunit-service$--$qunit' },
        { name: 'roku', value: 'wdio-roku-service$--$roku' },
        { name: 'obsidian', value: 'wdio-obsidian-service$--$obsidian' }
    ]
}

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
export const isNuxtProject = [
    path.join(process.cwd(), 'nuxt.config.js'),
    path.join(process.cwd(), 'nuxt.config.ts'),
    path.join(process.cwd(), 'nuxt.config.mjs'),
    path.join(process.cwd(), 'nuxt.config.mts')
].map((p) => {
    try {
        fs.accessSync(p)
        return true
    } catch {
        return false
    }
}).some(Boolean)

export const SUPPORTED_CONFIG_FILE_EXTENSION = ['js', 'ts', 'mjs', 'mts', 'cjs', 'cts']

export const CONFIG_HELPER_SERENITY_BANNER = `
Learn more about Serenity/JS:
  🔗 https://serenity-js.org/
  🔗 https://serenity-js.org/handbook/test-runners/webdriverio/
`

export function usesSerenity (answers: Questionnair) {
    return answers.framework.includes('serenity-js')
}

enum ProtocolOptions {
    HTTPS = 'https',
    HTTP = 'http'
}

export enum BackendChoice {
    Local = 'On my local machine',
    Experitest = 'In the cloud using Experitest',
    Saucelabs = 'In the cloud using Sauce Labs',
    Browserstack = 'In the cloud using BrowserStack',
    OtherVendors = 'In the cloud using Testingbot or LambdaTest or a different service',
    Grid = 'I have my own Selenium cloud'
}
export enum RegionOptions {
    US = 'us',
    EU = 'eu'
}

export enum ElectronBuildToolChoice {
    ElectronForge = 'Electron Forge (https://www.electronforge.io/)',
    ElectronBuilder = 'electron-builder (https://www.electron.build/)',
    SomethingElse = 'Something else'
}

export const SUPPORTED_BROWSER_RUNNER_PRESETS = [
    { name: 'Lit (https://lit.dev/)', value: '$--$' },
    { name: 'Vue.js (https://vuejs.org/)', value: '@vitejs/plugin-vue$--$vue' },
    { name: 'Svelte (https://svelte.dev/)', value: '@sveltejs/vite-plugin-svelte$--$svelte' },
    { name: 'SolidJS (https://www.solidjs.com/)', value: 'vite-plugin-solid$--$solid' },
    { name: 'StencilJS (https://stenciljs.com/)', value: '$--$stencil' },
    { name: 'React (https://reactjs.org/)', value: '@vitejs/plugin-react$--$react' },
    { name: 'Preact (https://preactjs.com/)', value: '@preact/preset-vite$--$preact' },
    { name: 'Other', value: null }
]

function isBrowserRunner (answers: Questionnair) {
    return answers.runner === SUPPORTED_PACKAGES.runner[1].value
}
function getTestingPurpose (answers: Questionnair) {
    return convertPackageHashToObject(answers.runner).purpose as 'e2e' | 'electron' | 'component' | 'vscode' | 'macos' | 'roku'
}

export const TESTING_LIBRARY_PACKAGES: Record<string, string> = {
    react: '@testing-library/react',
    preact: '@testing-library/preact',
    vue: '@testing-library/vue',
    svelte: '@testing-library/svelte',
    solid: 'solid-testing-library'
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
    { name: 'Chrome', value: 'chrome', checked: true },
    { name: 'Firefox', value: 'firefox' },
    { name: 'Safari', value: 'safari' },
    { name: 'Microsoft Edge', value: 'MicrosoftEdge' }
]

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
    message: 'Which mobile environment you\'d like to automate?',
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
        (answers.hostname === 'lambdatest.com' || answers.hostname?.endsWith('.lambdatest.com'))
    )
}, {
    type: 'input',
    name: 'env_key',
    message: 'Environment variable for access key',
    default: 'LT_ACCESS_KEY',
    when: /* istanbul ignore next */ (answers: Questionnair) => (
        answers.backend && answers.backend.indexOf('LambdaTest') > -1 &&
        (answers.hostname === 'lambdatest.com' || answers.hostname?.endsWith('.lambdatest.com'))
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
        'Read more on Sauce Connect at: https://docs.saucelabs.com/secure-connections/#sauce-connect-proxy'
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
    type: 'confirm',
    name: 'isUsingTypeScript',
    message: 'Do you want to use Typescript to write tests?',
    when: /* istanbul ignore next */ (answers: Questionnair) => {
        /**
         * StencilJS only supports TypeScript - use the default
         */
        if (answers.preset?.includes('stencil')) {
            return false
        }
        return true
    },
    default: /* istanbul ignore next */ (answers: Questionnair) => answers.preset?.includes('stencil') || detectCompiler(answers)
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
    when: /* istanbul ignore next */ (answers: Questionnair) => answers.generateTestFiles && /(mocha|jasmine)/.test(answers.framework)
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
    choices: SUPPORTED_PACKAGES.reporter
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
        } else if (getTestingPurpose(answers) === 'roku') {
            return [SUPPORTED_PACKAGES.service.find(({ name }) => name === 'roku')]
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
        } else if (getTestingPurpose(answers) === 'roku') {
            defaultServices.push('roku')
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

export const COMMUNITY_PACKAGES_WITH_TS_SUPPORT = [
    'wdio-electron-service',
    'wdio-vscode-service',
    'wdio-nuxt-service',
    'wdio-vite-service',
    'wdio-gmail-service',
    'wdio-roku-service',
    'wdio-obsidian-service'
]

export const DEPENDENCIES_INSTALLATION_MESSAGE = `
To install dependencies, execute:
%s
`
