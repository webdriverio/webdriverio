import type { WriteStream } from 'node:fs'
import { type HookStats, type RunnerStats, type SuiteStats, type Test, TestStats } from '@wdio/reporter'
import type {
    ConfigCapabilities,
    DesiredCapabilitiesExtended,
    HookStatsExtended,
    RunnerStatsExtended,
    SuiteStatsExtended,
    TestStatsExtended,
    TestrunnerExtended
} from '../../src/types/wdio'
import type { Feature, Scenario, cjson_metadata } from '../../src/types'
import type { Capabilities } from '@wdio/types'

export const EMPTY_FEATURE: Feature = {
    keyword: 'Feature',
    description: '',
    line: 2,
    name: 'Empty feature',
    tags: '',
    elements: [] as Scenario[],
    id: 'empty-feature',
}
export const EMPTY_SCENARIO: Scenario = {
    keyword: 'Scenario',
    description: '',
    name: 'Open website',
    tags: '',
    id: 'create-passed-featureopen-website',
    steps: [],
}
export const SMALL_RUNNER_STATS: RunnerStats = {
    capabilities:
        {
            browserName: 'chrome',
            'goog:chromeOptions': {
                debuggerAddress: 'localhost:53158'
            },
            proxy: {},
        },
    config: {},
    type: 'runner',
    start: new Date('2019-07-14T07:25:20.897Z'),
    _duration: 0,
    duration: 0,
    complete: (): void => {
        // noop
    },
    cid: '0-0',
    sessionId: '',
    instanceOptions: {},
    sanitizedCapabilities: 'chrome.75_0_3770_100.macosx',
    specs: ['/Users/wswebcreation/Sauce/Git/webdriverio-cucumberjs/__tests__/features/passed.feature'],
    isMultiRemote: false
}
export const FULL_RUNNER_STATS: RunnerStatsExtended = {
    type: 'runner',
    start: new Date('2019-07-14T07:25:20.897Z'),
    _duration: 0,
    cid: '0-0',
    capabilities:
        <DesiredCapabilitiesExtended>{
            'cjson:metadata': {} as cjson_metadata,
            acceptInsecureCerts: false,
            acceptSslCerts: false,
            applicationCacheEnabled: false,
            browserConnectionEnabled: false,
            browserName: 'chrome',
            chromedriverVersion: '2.46.628411 (3324f4c8be9ff2f70a05a30ebc72ffb013e1a71e)',
            chromeOptions: {
                args: ['user-data-dir=/var/folders/rb/_hbqv7fn5114b206t2s05fs40000gn/T/.org.chromium.Chromium.uwkY0A'],
            },
            cssSelectorsEnabled: true,
            databaseEnabled: false,
            'goog:chromeOptions': {
                debuggerAddress: 'localhost:53158'
            },
            handlesAlerts: true,
            javascriptEnabled: true,
            locationContextEnabled: true,
            mobileEmulationEnabled: false,
            nativeEvents: true,
            pageLoadStrategy: 'normal' as Capabilities.PageLoadingStrategy,
            platform: 'Mac OS X',
            proxy: {},
            rotatable: false,
            setWindowRect: true,
            strictFileInteractability: false,
            timeouts: {
                implicit: 0,
                pageLoad: 300000,
                script: 30000,
            },
            unexpectedAlertBehaviour: 'ignore',
            version: '75.0.3770.100',
            webStorageEnabled: true,
            'webdriver.remote.sessionid': 'b2e560a6ed31a6551fa3509109b71f14'
        },
    sanitizedCapabilities: 'chrome.75_0_3770_100.macosx',
    config: <TestrunnerExtended>{
        hostname: '127.0.0.1',
        port: 4444,
        protocol: 'http',
        specs: ['/Users/wswebcreation/Sauce/Git/webdriverio-cucumberjs/__tests__/**/passed.feature'],
        suites: {},
        exclude: [],
        outputDir: undefined,
        logLevel: 'silent',
        logLevels: {},
        baseUrl: 'http://webdriver.io',
        bail: 0,
        waitforInterval: 500,
        waitforTimeout: 20000,
        framework: 'cucumber',
        reporters: ['spec'],
        maxInstances: 100,
        maxInstancesPerCapability: 100,
        filesToWatch: [],
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3,
        execArgv: [],
        runnerEnv: {},
        runner: 'local',
        mochaOpts: {
            timeout: 10000,
        },
        cucumberOpts:
        {
            timeout: 60000,
            backtrace: false,
            colors: true,
            snippets: true,
            source: true,
            tagExpression: 'not @wip and not @ignore',
            failAmbiguousDefinitions: false,
            ignoreUndefinedDefinitions: false
        },
        onPrepare: [],
        before: [],
        beforeSession: [],
        beforeSuite: [],
        beforeHook: [],
        beforeTest: [],
        beforeCommand: [],
        afterCommand: [],
        afterTest: [],
        afterHook: [],
        afterSuite: [],
        afterSession: [],
        after: [],
        onComplete: [],
        onReload: [],
        services: [],
        capabilities: {},
        jsonFolder: '',
        language: 'en',
        'cjson:metadata': {
            app: {
                name: 'test',
                version: '1'
            }
        } as cjson_metadata,
        logFile: '',
        stdout: true,
        writeStream: {} as WriteStream,
    },
    specs: ['/Users/wswebcreation/Sauce/Git/webdriverio-cucumberjs/__tests__/features/passed.feature'],
    sessionId: 'b2e560a6ed31a6551fa3509109b71f14',
    isMultiRemote: false,
    retry: 0,
    duration: 0,
    complete: (): void => {
        // noop
    },
    instanceOptions: {}
}
export const WDIO6_RUNNER_STATS: RunnerStatsExtended = {
    type: 'runner',
    start: new Date('2020-04-27T13:24:19.166Z'),
    _duration: 0,
    cid: '0-0',
    capabilities: {
        acceptInsecureCerts: false,
        browserName: 'chrome',
        browserVersion: '81.0.4044.122',
        'goog:chromeOptions': { debuggerAddress: 'localhost:56189' },
        pageLoadStrategy: 'normal',
        platformName: 'mac os x',
        proxy: {},
        setWindowRect: true,
        strictFileInteractability: false,
        timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },
        unhandledPromptBehavior: 'dismiss and notify'
    },
    sanitizedCapabilities: 'chrome.81_0_4044_122.macosx',
    config: <TestrunnerExtended>{
        jsonFolder: '',
        language: 'en',
        'cjson:metadata': {} as cjson_metadata,
        logFile: '',
        stdout: true,
        writeStream: {} as WriteStream,
        capabilities: {}
    },
    specs: ['/Users/wimselles/Git/cucumberjs-json-demo/google.feature'],
    sessionId: '27e5b2b068aa1612e60d90a9e5164a7d',
    isMultiRemote: false,
    retry: 0,
    duration: 0,
    complete: (): void => {
        // noop
    },
    instanceOptions: {},
}
export const CAPS_METADATA_RUNNER_STATS: RunnerStatsExtended = {
    type: 'runner',
    start: new Date('2020-04-27T13:24:19.166Z'),
    _duration: 0,
    cid: '0-0',
    capabilities: {},
    sanitizedCapabilities: 'chrome.81_0_4044_122.macosx',
    config: <TestrunnerExtended>{
        capabilities: <ConfigCapabilities>{
            browserName: 'chrome',
            'cjson:metadata': {
                device: 'Test Device',
                browser: {
                    name: 'safari',
                    version: '14.1',
                },
                platform: {
                    name: 'ios',
                    version: '14',
                }
            }
        }
    },
    specs: ['/Users/wimselles/Git/cucumberjs-json-demo/google.feature'],
    sessionId: '27e5b2b068aa1612e60d90a9e5164a7d',
    isMultiRemote: false,
    retry: 0,
    duration: 0,
    complete: (): void => {
        // noop
    },
    instanceOptions: {},
}
export const SUITE_FEATURE_STATS: SuiteStatsExtended = {
    type: 'feature',
    start: new Date('2019-07-15T14:40:50.761Z'),
    uid: 'Create passed feature2',
    cid: '0-0',
    title: 'Create passed feature',
    fullTitle: '',
    tests: [] as TestStats[],
    hooks: [] as HookStats[],
    suites: [] as SuiteStats[],
    duration: 0,
    _duration: 0,
    hooksAndTests: [] as HookStats[],
    complete: () => {
        // noop
    },
    file: '',
    parent: undefined,
    description: '',
}
export const SUITE_FEATURE_UID: SuiteStatsExtended = {
    type: 'feature',
    start: new Date('2019-07-15T14:40:50.761Z'),
    _duration: 0,
    uid: '',
    cid: '0-0',
    title: 'Create passed feature',
    fullTitle: '',
    tests: [],
    hooks: [],
    suites: [],
    hooksAndTests: [] as HookStats[],
    complete: () => {
        // noop
    },
    file: '',
    duration: 0,
    parent: undefined,
    description: '',
}
export const SUITE_SCENARIO_STATS: SuiteStatsExtended = {
    type: 'scenario',
    start: new Date('2019-07-15T14:40:50.761Z'),
    uid: 'Open website2',
    cid: '0-0',
    title: 'Open website',
    fullTitle: '',
    tests: [] as TestStats[],
    hooks: [] as HookStats[],
    suites: [] as SuiteStats[],
    duration: 0,
    _duration: 0,
    hooksAndTests: [] as HookStats[],
    complete: () => {
        // noop
    },
    file: '',
    parent: 'sample.feature:2:1',
    description: '',
}
const test: Test = {
    type: 'test:start',
    title: '',
    parent: '',
    fullTitle: '',
    pending: false,
    cid: '',
    specs: [],
    uid: '',
}

const STEP_TEST_ONSTART_STATS_Initial: TestStatsExtended = JSON.parse(JSON.stringify(test))
STEP_TEST_ONSTART_STATS_Initial.id = 'create-passed-featurehook-this-is-doing-nothing-because-it\'s-a-background"'
STEP_TEST_ONSTART_STATS_Initial.keyword = 'Given'
STEP_TEST_ONSTART_STATS_Initial.uid = 'I open "http://webdriver.io/"6'
STEP_TEST_ONSTART_STATS_Initial.title = 'Given I open "http://webdriver.io/"'
STEP_TEST_ONSTART_STATS_Initial.name = 'I open "http://webdriver.io/"6'
export const STEP_TEST_ONSTART_STATS = STEP_TEST_ONSTART_STATS_Initial
const STEP_TEST_ONSTART_ARGUMENT_STATS_Initial: TestStatsExtended = JSON.parse(JSON.stringify(test))
STEP_TEST_ONSTART_ARGUMENT_STATS_Initial.argument = {
    'rows': [
        {
            'cells': [
                'Cucumber',
                'Cucumis sativus'
            ]
        },
        {
            'cells': [
                'Burr Gherkin',
                'Cucumis anguria'
            ]
        }
    ]
}
STEP_TEST_ONSTART_ARGUMENT_STATS_Initial.keyword = 'Given'
STEP_TEST_ONSTART_ARGUMENT_STATS_Initial.uid = 'I open "http://webdriver.io/"6'
STEP_TEST_ONSTART_ARGUMENT_STATS_Initial.title = 'Given I open "http://webdriver.io/"'
STEP_TEST_ONSTART_ARGUMENT_STATS_Initial.name = 'Given I open "http://webdriver.io/"'

export const STEP_TEST_ONSTART_ARGUMENT_STATS = STEP_TEST_ONSTART_ARGUMENT_STATS_Initial
export const STEP_HOOK_ONSTART_STATS: HookStatsExtended = {
    'type': 'hook',
    'start': new Date('2019-07-19T21:15:01.172Z'),
    '_duration': 0,
    'uid': 'all.steps.js43',
    'cid': '0-0',
    'title': 'Hook',
    'parent': 'Create failed feature: Open website',
    'keyword': '',
    duration: 0,
    complete: () => {
        // noop
    }
}

test.title = 'Hook This is doing nothing because it\'s a background"'
export const TEST_SCENARIO_STATS = new TestStats(test)

const TEST_NO_KEYWORD_STATS_Initial: TestStatsExtended = new TestStats(test)
TEST_NO_KEYWORD_STATS_Initial.uid = '13'
TEST_NO_KEYWORD_STATS_Initial.title = 'I load the Swag Labs demo website'
TEST_NO_KEYWORD_STATS_Initial.state = 'passed'
TEST_NO_KEYWORD_STATS_Initial._duration = 555
export const TEST_NO_KEYWORD_STATS: TestStatsExtended = TEST_NO_KEYWORD_STATS_Initial

const TEST_SCENARIO_STATS_ERROR_Initial: TestStatsExtended = new TestStats(test)
TEST_SCENARIO_STATS_ERROR_Initial.state = 'failed'
TEST_SCENARIO_STATS_ERROR_Initial.errors = [{
    name: 'Error',
    message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoEqual\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m) // deep equality\u001b[22m\n\nExpected: \u001b[32m"bar"\u001b[39m\nReceived: \u001b[31m"foo"\u001b[39m',
    stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoEqual\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m) // deep equality\u001b[22m\n\nExpected: \u001b[32m"bar"\u001b[39m\nReceived: \u001b[31m"foo"\u001b[39m\n    at World.<anonymous> (/Users/wimselles/Git/cucumberjs-json-demo/steps.js:17:19)'
}]
TEST_SCENARIO_STATS_ERROR_Initial.error = {
    name: 'Error',
    message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoEqual\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m) // deep equality\u001b[22m\n\nExpected: \u001b[32m"bar"\u001b[39m\nReceived: \u001b[31m"foo"\u001b[39m',
    stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoEqual\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m) // deep equality\u001b[22m\n\nExpected: \u001b[32m"bar"\u001b[39m\nReceived: \u001b[31m"foo"\u001b[39m\n    at World.<anonymous> (/Users/wimselles/Git/cucumberjs-json-demo/steps.js:17:19)'
}
export const TEST_SCENARIO_STATS_ERROR: TestStatsExtended = TEST_SCENARIO_STATS_ERROR_Initial
test.title = ''
const TEST_EMPTY_STATS_Initial: TestStatsExtended = new TestStats(test)
TEST_EMPTY_STATS_Initial.title = ''
export const TEST_EMPTY_STATS: TestStatsExtended = TEST_EMPTY_STATS_Initial

// PAYLOADS

// Read the instance that  is running
// const onRunnerStart = {
//         'type': 'runner',
//         'start': '2019-07-19T21:15:00.861Z',
//         '_duration': 0,
//         'cid': '0-0',
//         'capabilities': {
//             'acceptInsecureCerts': false,
//             'acceptSslCerts': false,
//             'applicationCacheEnabled': false,
//             'browserConnectionEnabled': false,
//             'browserName': 'chrome',
//             'chrome': {
//                 'chromedriverVersion': '2.46.628411 (3324f4c8be9ff2f70a05a30ebc72ffb013e1a71e)',
//                 'userDataDir': '/var/folders/rb/_hbqv7fn5114b206t2s05fs40000gn/T/.org.chromium.Chromium.iZqqfV'
//             },
//             'cssSelectorsEnabled': true,
//             'databaseEnabled': false,
//             'goog:chromeOptions': { 'debuggerAddress': 'localhost:58815' },
//             'handlesAlerts': true,
//             'hasTouchScreen': false,
//             'javascriptEnabled': true,
//             'locationContextEnabled': true,
//             'mobileEmulationEnabled': false,
//             'nativeEvents': true,
//             'networkConnectionEnabled': false,
//             'pageLoadStrategy': 'normal',
//             'platform': 'Mac OS X',
//             'proxy': {},
//             'rotatable': false,
//             'setWindowRect': true,
//             'strictFileInteractability': false,
//             'takesHeapSnapshot': true,
//             'takesScreenshot': true,
//             'timeouts': { 'implicit': 0, 'pageLoad': 300000, 'script': 30000 },
//             'unexpectedAlertBehaviour': 'ignore',
//             'version': '75.0.3770.142',
//             'webStorageEnabled': true,
//             'webdriver.remote.sessionid': 'c1c3d5fbe0e5f2cf391868253f7f80c1'
//         },
//         'sanitizedCapabilities': 'chrome.75_0_3770_142.macosx',
//         'config': {
//             'hostname': '127.0.0.1',
//             'port': 4444,
//             'protocol': 'http',
//             'sync': true,
//             'specs': [ '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/**/failed.feature' ],
//             'suites': {},
//             'exclude': [],
//             'logLevel': 'silent',
//             'logLevels': {},
//             'excludeDriverLogs': [],
//             'baseUrl': 'http://webdriver.io',
//             'bail': 0,
//             'waitforInterval': 500,
//             'waitforTimeout': 20000,
//             'framework': 'cucumber',
//             'reporters': [ 'spec', [ 'multiple-cucumber-html', {
//                 'removeFolders': true,
//                 'reportFolder': '.tmp/multiple-cucumber-html-reporter/',
//                 'displayDuration': true,
//                 'openReportInBrowser': false,
//                 'saveCollectedJSON': true,
//                 'disableLog': true,
//                 'pageTitle': 'pageTitle',
//                 'reportName': 'reportName',
//                 'pageFooter': '<div><h1>Custom footer</h1></div>',
//                 'customData': {
//                     'title': 'Run info',
//                     'data': [ { 'label': 'Project', 'value': 'Custom project' }, { 'label': 'Release', 'value': '1.2.3' }, {
//                         'label': 'Cycle',
//                         'value': 'B11221.34321'
//                     }, { 'label': 'Execution Start Time', 'value': 'Nov 19th 2017, 02:31 PM EST' }, {
//                         'label': 'Execution End Time',
//                         'value': 'Nov 19th 2017, 02:56 PM EST'
//                     } ]
//                 }
//             } ] ],
//             'maxInstances': 100,
//             'maxInstancesPerCapability': 100,
//             'filesToWatch': [],
//             'connectionRetryTimeout': 90000,
//             'connectionRetryCount': 3,
//             'debug': false,
//             'execArgv': [],
//             'runnerEnv': {},
//             'runner': 'local',
//             'mochaOpts': { 'timeout': 10000 },
//             'jasmineNodeOpts': { 'defaultTimeoutInterval': 10000 },
//             'cucumberOpts': {
//                 'timeout': 60000,
//                 'require': [ '__tests__/**/*.steps.js' ],
//                 'backtrace': false,
//                 'colors': true,
//                 'snippets': true,
//                 'source': true,
//                 'tagExpression': 'not @wip and not @ignore',
//                 'failAmbiguousDefinitions': false,
//                 'ignoreUndefinedDefinitions': false
//             },
//             'onPrepare': [],
//             'before': [ null ],
//             'beforeSession': [ null ],
//             'beforeSuite': [],
//             'beforeHook': [],
//             'beforeTest': [],
//             'beforeCommand': [],
//             'afterCommand': [],
//             'afterTest': [],
//             'afterHook': [],
//             'afterSuite': [],
//             'afterSession': [],
//             'after': [],
//             'onComplete': [],
//             'onReload': [],
//             'beforeFeature': [],
//             'beforeScenario': [],
//             'beforeStep': [],
//             'afterFeature': [],
//             'afterScenario': [],
//             'afterStep': [],
//             'coloredLogs': true,
//             'services': [],
//             '_': [ '__tests__/config/wdio.browsers.conf.js' ],
//             'feature': 'failed',
//             '$0': '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/node_modules/.bin/wdio',
//             'capabilities': {
//                 'browserName': 'chrome',
//                 'goog:chromeOptions': {
//                     'args': [ '--headless', 'disable-infobars' ],
//                     'prefs': { 'download': { 'prompt_for_download': false, 'directory_upgrade': true, 'default_directory': './tmp' }
// } }, 'mchr:metadata': { 'browser': { 'name': 'chrome', 'version': '58' }, 'device': 'MacBook Pro 15', 'platform': { 'name': 'OSX',
// 'version': '10.12.6' } } } }, 'specs': [ '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/features/failed.feature' ],
// 'sessionId': 'c1c3d5fbe0e5f2cf391868253f7f80c1', 'isMultiRemote': false, 'retry': 0 }

// Read the feature
// const onSuiteStart = {
//     'type': 'suite',
//     'start': '2019-07-19T21:15:01.160Z',
//     '_duration': 0,
//     'uid': 'Create failed feature2',
//     'cid': '0-0',
//     'title': 'Create failed feature',
//     'tests': [],
//     'hooks': [],
//     'suites': []
// }

// Read the scenario
// const onSuiteStart2 = {
//     'type': 'suite',
//     'start': '2019-07-19T21:15:01.171Z',
//     '_duration': 0,
//     'uid': 'Open website5',
//     'cid': '0-0',
//     'title': 'Open website',
//     'fullTitle': 'Create failed feature2: Open website',
//     'tests': [],
//     'hooks': [],
//     'suites': []
// }

// Start hook
// const onHookStart = {
//     'type': 'hook',
//     'start': '2019-07-19T21:15:01.172Z',
//     '_duration': 0,
//     'uid': 'all.steps.js43',
//     'cid': '0-0',
//     'title': 'Hook',
//     'parent': 'Create failed feature: Open website'
// }

// End of hook
// const onHookEnd = {
//     'type': 'hook',
//     'start': '2019-07-19T21:15:01.172Z',
//     '_duration': 3,
//     'uid': 'all.steps.js43',
//     'cid': '0-0',
//     'title': 'Hook',
//     'parent': 'Create failed feature: Open website',
//     'errors': [],
//     'end': '2019-07-19T21:15:01.175Z'
// }

// Start a step
// const onTestStart = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:01.176Z',
//     '_duration': 0,
//     'uid': 'I open "http://webdriver.io/"6',
//     'cid': '0-0',
//     'title': 'Given I open "http://webdriver.io/"',
//     'fullTitle': 'Create failed feature: Open website: Given I open "http://webdriver.io/"',
//     'output': [],
//     'state': 'pending'
// }

// Start a command
// const onBeforeCommand = {
//     'method': 'POST',
//     'endpoint': '/session/:sessionId/url',
//     'body': { 'url': 'http://webdriver.io/' },
//     'sessionId': 'c1c3d5fbe0e5f2cf391868253f7f80c1',
//     'cid': '0-0'
// }

// Result of a command
// const onAfterCommand = {
//     'method': 'POST',
//     'endpoint': '/session/:sessionId/url',
//     'body': { 'url': 'http://webdriver.io/' },
//     'result': { 'sessionId': 'c1c3d5fbe0e5f2cf391868253f7f80c1', 'status': 0, 'value': null },
//     'sessionId': 'c1c3d5fbe0e5f2cf391868253f7f80c1',
//     'cid': '0-0'
// }

// Test status result
// const onTestPass = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:01.176Z',
//     '_duration': 1417,
//     'uid': 'I open "http://webdriver.io/"6',
//     'cid': '0-0',
//     'title': 'Given I open "http://webdriver.io/"',
//     'fullTitle': 'Create failed feature: Open website: Given I open "http://webdriver.io/"',
//     'output': [],
//     'state': 'passed',
//     'end': '2019-07-19T21:15:02.593Z'
// }

// New step
// const onTestStart2 = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:02.594Z',
//     '_duration': 0,
//     'uid': 'the title would say "WebdriverIO"7',
//     'cid': '0-0',
//     'title': 'Then the title would say "WebdriverIO"',
//     'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO"',
//     'output': [],
//     'state': 'pending'
// }

// Failed step with errors
// const onTestFail = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:02.594Z',
//     '_duration': 9,
//     'uid': 'the title would say "WebdriverIO"7',
//     'cid': '0-0',
//     'title': 'Then the title would say "WebdriverIO"',
//     'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO"',
//     'output': [],
//     'state': 'failed',
//     'end': '2019-07-19T21:15:02.603Z',
//     'errors': [ {
//         'name': 'AssertionError',
//         'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'',
//         'showDiff': true,
//         'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js',
//         'expected': 'WebdriverIO',
//         'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'\n
// at World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)' } ], 'error': {
// 'name': 'AssertionError', 'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal
// \'WebdriverIO\'', 'showDiff': true, 'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js', 'expected': 'WebdriverIO',
// 'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'\n    at
// World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)' } }

// New step
// const onTestStart3 = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:02.603Z',
//     '_duration': 0,
//     'uid': 'the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"8',
//     'cid': '0-0',
//     'title': 'Then the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"',
//     'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"', 'output': [], 'state': 'pending' }

// skipped status
// const onTestSkip = {
//     'type': 'test',
//     'start': '2019-07-19T21:15:02.604Z',
//     '_duration': 0,
//     'uid': 'the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"8',
//     'cid': '0-0',
//     'title': 'Then the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"',
//     'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"', 'output': [], 'state': 'skipped' }

// Hook start
// const onHookStart2 = {
//     'type': 'hook',
//     'start': '2019-07-19T21:15:02.604Z',
//     '_duration': 0,
//     'uid': 'all.steps.js69',
//     'cid': '0-0',
//     'title': 'Hook',
//     'parent': 'Create failed feature: Open website'
// }

// Hook end
// const onHookEnd2 = {
//     'type': 'hook',
//     'start': '2019-07-19T21:15:02.604Z',
//     '_duration': 1,
//     'uid': 'all.steps.js69',
//     'cid': '0-0',
//     'title': 'Hook',
//     'parent': 'Create failed feature: Open website',
//     'errors': [],
//     'end': '2019-07-19T21:15:02.605Z'
// }

// Will hold all steps and statuses, and hooks of 1 scenario
// const onSuiteEnd = {
//     'type': 'suite',
//     'start': '2019-07-19T21:15:01.171Z',
//     '_duration': 1434,
//     'uid': 'Open website5',
//     'cid': '0-0',
//     'title': 'Open website',
//     'fullTitle': 'Create failed feature2: Open website',
//     'tests': [
//         {
//             'type': 'test',
//             'start': '2019-07-19T21:15:01.176Z',
//             '_duration': 1417,
//             'uid': 'I open "http://webdriver.io/"6',
//             'cid': '0-0',
//             'title': 'Given I open "http://webdriver.io/"',
//             'fullTitle': 'Create failed feature: Open website: Given I open "http://webdriver.io/"',
//             'output': [],
//             'state': 'passed',
//             'end': '2019-07-19T21:15:02.593Z'
//         },
//         {
//             'type': 'test',
//             'start': '2019-07-19T21:15:02.594Z',
//             '_duration': 9,
//             'uid': 'the title would say "WebdriverIO"7',
//             'cid': '0-0',
//             'title': 'Then the title would say "WebdriverIO"',
//             'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO"',
//             'output': [],
//             'state': 'failed',
//             'end': '2019-07-19T21:15:02.603Z',
//             'errors': [
//                 {
//                     'name': 'AssertionError',
//                     'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'',
//                     'showDiff': true,
//                     'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js',
//                     'expected': 'WebdriverIO',
//                     'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal
// \'WebdriverIO\'\n    at World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)'
// }, ], 'error': { 'name': 'AssertionError', 'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal
// \'WebdriverIO\'', 'showDiff': true, 'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js', 'expected': 'WebdriverIO',
// 'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'\n    at
// World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)' }, }, { 'type': 'test',
// 'start': '2019-07-19T21:15:02.604Z', '_duration': 0, 'uid': 'the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"8', 'cid': '0-0', 'title': 'Then the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"',
// 'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"', 'output': [], 'state': 'skipped' }, ], 'hooks': [ { 'type': 'hook', 'start': '2019-07-19T21:15:01.172Z', '_duration': 3,
// 'uid': 'all.steps.js43', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create failed feature: Open website', 'errors': [], 'end': '2019-07-19T21:15:01.175Z' }, { 'type': 'hook', 'start': '2019-07-19T21:15:02.604Z', '_duration': 1, 'uid': 'all.steps.js69', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create failed feature: Open website', 'errors': [], 'end': '2019-07-19T21:15:02.605Z' }, ], 'suites': [], 'end': '2019-07-19T21:15:02.605Z' }

// Will hold all scenario's
// const onSuiteEnd2 = {
//     'type': 'suite',
//     'start': '2019-07-19T21:15:01.160Z',
//     '_duration': 1446,
//     'uid': 'Create failed feature2',
//     'cid': '0-0',
//     'title': 'Create failed feature',
//     'tests': [],
//     'hooks': [],
//     'suites': [ {
//         'type': 'suite',
//         'start': '2019-07-19T21:15:01.171Z',
//         '_duration': 1434,
//         'uid': 'Open website5',
//         'cid': '0-0',
//         'title': 'Open website',
//         'fullTitle': 'Create failed feature2: Open website',
//         'tests': [
//             {
//                 'type': 'test',
//                 'start': '2019-07-19T21:15:01.176Z',
//                 '_duration': 1417,
//                 'uid': 'I open "http://webdriver.io/"6',
//                 'cid': '0-0',
//                 'title': 'Given I open "http://webdriver.io/"',
//                 'fullTitle': 'Create failed feature: Open website: Given I open "http://webdriver.io/"',
//                 'output': [],
//                 'state': 'passed',
//                 'end': '2019-07-19T21:15:02.593Z'
//             },
//             {
//                 'type': 'test',
//                 'start': '2019-07-19T21:15:02.594Z',
//                 '_duration': 9,
//                 'uid': 'the title would say "WebdriverIO"7',
//                 'cid': '0-0',
//                 'title': 'Then the title would say "WebdriverIO"',
//                 'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO"',
//                 'output': [],
//                 'state': 'failed',
//                 'end': '2019-07-19T21:15:02.603Z',
//                 'errors': [
//                     {
//                         'name': 'AssertionError',
//                         'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'',
//                         'showDiff': true,
//                         'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js',
//                         'expected': 'WebdriverIO',
//                         'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal
// \'WebdriverIO\'\n    at World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)'
// }, ], 'error': { 'name': 'AssertionError', 'message': 'expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal
// \'WebdriverIO\'', 'showDiff': true, 'actual': 'WebdriverIO · Next-gen WebDriver test framework for Node.js', 'expected': 'WebdriverIO',
// 'stack': 'AssertionError: expected \'WebdriverIO · Next-gen WebDriver test framework for Node.js\' to equal \'WebdriverIO\'\n    at
// World.equal (/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/step_definitions/all.steps.js:39:35)' } }, { 'type': 'test',
// 'start': '2019-07-19T21:15:02.604Z', '_duration': 0, 'uid': 'the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"8', 'cid': '0-0', 'title': 'Then the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"',
// 'fullTitle': 'Create failed feature: Open website: Then the title would say "WebdriverIO · Next-gen WebDriver test framework for
// Node.js"', 'output': [], 'state': 'skipped' }, ], 'hooks': [ { 'type': 'hook', 'start': '2019-07-19T21:15:01.172Z', '_duration': 3,
// 'uid': 'all.steps.js43', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create failed feature: Open website', 'errors': [], 'end': '2019-07-19T21:15:01.175Z' }, { 'type': 'hook', 'start': '2019-07-19T21:15:02.604Z', '_duration': 1, 'uid': 'all.steps.js69', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create failed feature: Open website', 'errors': [], 'end': '2019-07-19T21:15:02.605Z' }, ], 'suites': [], 'end': '2019-07-19T21:15:02.605Z' } ], 'end': '2019-07-19T21:15:02.606Z' }

// This is an example with 2 scenario's
// const onSuiteEnd3 = {
//     'type': 'suite',
//     'start': '2019-07-19T21:47:16.776Z',
//     '_duration': 2121,
//     'uid': 'Create passed feature2',
//     'cid': '0-0',
//     'title': 'Create passed feature',
//     'tests': [],
//     'hooks': [],
//     'suites': [
//         {
//             'type': 'suite',
//             'start': '2019-07-19T21:47:16.787Z',
//             '_duration': 1369,
//             'uid': 'Open website6',
//             'cid': '0-0',
//             'title': 'Open website',
//             'fullTitle': 'Create passed feature2: Open website',
//             'tests': [
//                 {
//                     'type': 'test',
//                     'start': '2019-07-19T21:47:16.791Z',
//                     '_duration': 1354,
//                     'uid': 'I open "http://webdriver.io/"7',
//                     'cid': '0-0',
//                     'title': 'Given I open "http://webdriver.io/"',
//                     'fullTitle': 'Create passed feature: Open website: Given I open "http://webdriver.io/"',
//                     'output': [],
//                     'state': 'passed',
//                     'end': '2019-07-19T21:47:18.145Z'
//                 },
//                 {
//                     'type': 'test',
//                     'start': '2019-07-19T21:47:18.145Z',
//                     '_duration': 10,
//                     'uid': 'the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"8',
//                     'cid': '0-0',
//                     'title': 'Then the title would say "WebdriverIO · Next-gen WebDriver test framework for Node.js"',
//                     'fullTitle': 'Create passed feature: Open website: Then the title would say "WebdriverIO · Next-gen WebDriver test
// framework for Node.js"', 'output': [], 'state': 'passed', 'end': '2019-07-19T21:47:18.155Z' }, ], 'hooks': [ { 'type': 'hook', 'start':
// '2019-07-19T21:47:16.788Z', '_duration': 3, 'uid': 'all.steps.js43', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create passed feature:
// Open website', 'errors': [], 'end': '2019-07-19T21:47:16.791Z' }, { 'type': 'hook', 'start': '2019-07-19T21:47:18.155Z', '_duration': 1,
// 'uid': 'all.steps.js69', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create passed feature: Open website', 'errors': [], 'end':
// '2019-07-19T21:47:18.156Z' }, ], 'suites': [], 'end': '2019-07-19T21:47:18.156Z' }, { 'type': 'suite', 'start':
// '2019-07-19T21:47:18.157Z', '_duration': 739, 'uid': 'Open other website11', 'cid': '0-0', 'title': 'Open other website', 'fullTitle':
// 'Create passed feature2: Open other website', 'tests': [ { 'type': 'test', 'start': '2019-07-19T21:47:18.157Z', '_duration': 734, 'uid':
// 'I open "https://developer.mozilla.org/nl/"12', 'cid': '0-0', 'title': 'Given I open "https://developer.mozilla.org/nl/"', 'fullTitle':
// 'Create passed feature: Open other website: Given I open "https://developer.mozilla.org/nl/"', 'output': [], 'state': 'passed', 'end':
// '2019-07-19T21:47:18.891Z' }, { 'type': 'test', 'start': '2019-07-19T21:47:18.891Z', '_duration': 5, 'uid': 'the title would say "MDN-webdocumenten"13', 'cid': '0-0', 'title': 'Then the title would say "MDN-webdocumenten"', 'fullTitle': 'Create passed feature: Open other website: Then the title would say "MDN-webdocumenten"', 'output': [], 'state': 'passed', 'end': '2019-07-19T21:47:18.896Z' }, ], 'hooks': [ { 'type': 'hook', 'start': '2019-07-19T21:47:18.157Z', '_duration': 0, 'uid': 'all.steps.js43', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create passed feature: Open other website', 'errors': [], 'end': '2019-07-19T21:47:18.157Z' }, { 'type': 'hook', 'start': '2019-07-19T21:47:18.896Z', '_duration': 0, 'uid': 'all.steps.js69', 'cid': '0-0', 'title': 'Hook', 'parent': 'Create passed feature: Open other website', 'errors': [], 'end': '2019-07-19T21:47:18.896Z' }, ], 'suites': [], 'end': '2019-07-19T21:47:18.896Z' }, ], 'end': '2019-07-19T21:47:18.897Z' }

// Runner is done
// const onRunnerEnd = {
//     'type': 'runner',
//     'start': '2019-07-19T21:15:00.861Z',
//     '_duration': 1800,
//     'cid': '0-0',
//     'capabilities': {
//         'acceptInsecureCerts': false,
//         'acceptSslCerts': false,
//         'applicationCacheEnabled': false,
//         'browserConnectionEnabled': false,
//         'browserName': 'chrome',
//         'chrome': {
//             'chromedriverVersion': '2.46.628411 (3324f4c8be9ff2f70a05a30ebc72ffb013e1a71e)',
//             'userDataDir': '/var/folders/rb/_hbqv7fn5114b206t2s05fs40000gn/T/.org.chromium.Chromium.iZqqfV'
//         },
//         'cssSelectorsEnabled': true,
//         'databaseEnabled': false,
//         'goog:chromeOptions': { 'debuggerAddress': 'localhost:58815' },
//         'handlesAlerts': true,
//         'hasTouchScreen': false,
//         'javascriptEnabled': true,
//         'locationContextEnabled': true,
//         'mobileEmulationEnabled': false,
//         'nativeEvents': true,
//         'networkConnectionEnabled': false,
//         'pageLoadStrategy': 'normal',
//         'platform': 'Mac OS X',
//         'proxy': {},
//         'rotatable': false,
//         'setWindowRect': true,
//         'strictFileInteractability': false,
//         'takesHeapSnapshot': true,
//         'takesScreenshot': true,
//         'timeouts': { 'implicit': 0, 'pageLoad': 300000, 'script': 30000 },
//         'unexpectedAlertBehaviour': 'ignore',
//         'version': '75.0.3770.142',
//         'webStorageEnabled': true,
//         'webdriver.remote.sessionid': 'c1c3d5fbe0e5f2cf391868253f7f80c1'
//     },
//     'sanitizedCapabilities': 'chrome.75_0_3770_142.macosx',
//     'config': {
//         'hostname': '127.0.0.1',
//         'port': 4444,
//         'protocol': 'http',
//         'sync': true,
//         'specs': [ '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/**/failed.feature' ],
//         'suites': {},
//         'exclude': [],
//         'logLevel': 'silent',
//         'logLevels': {},
//         'excludeDriverLogs': [],
//         'baseUrl': 'http://webdriver.io',
//         'bail': 0,
//         'waitforInterval': 500,
//         'waitforTimeout': 20000,
//         'framework': 'cucumber',
//         'reporters': [ 'spec', [ 'multiple-cucumber-html', {
//             'removeFolders': true,
//             'reportFolder': '.tmp/multiple-cucumber-html-reporter/',
//             'displayDuration': true,
//             'openReportInBrowser': false,
//             'saveCollectedJSON': true,
//             'disableLog': true,
//             'pageTitle': 'pageTitle',
//             'reportName': 'reportName',
//             'pageFooter': '<div><h1>Custom footer</h1></div>',
//             'customData': {
//                 'title': 'Run info',
//                 'data': [ { 'label': 'Project', 'value': 'Custom project' }, { 'label': 'Release', 'value': '1.2.3' }, {
//                     'label': 'Cycle',
//                     'value': 'B11221.34321'
//                 }, { 'label': 'Execution Start Time', 'value': 'Nov 19th 2017, 02:31 PM EST' }, {
//                     'label': 'Execution End Time',
//                     'value': 'Nov 19th 2017, 02:56 PM EST'
//                 } ]
//             }
//         } ] ],
//         'maxInstances': 100,
//         'maxInstancesPerCapability': 100,
//         'filesToWatch': [],
//         'connectionRetryTimeout': 90000,
//         'connectionRetryCount': 3,
//         'debug': false,
//         'execArgv': [],
//         'runnerEnv': {},
//         'runner': 'local',
//         'mochaOpts': { 'timeout': 10000 },
//         'jasmineNodeOpts': { 'defaultTimeoutInterval': 10000 },
//         'cucumberOpts': {
//             'timeout': 60000,
//             'require': [ '__tests__/**/*.steps.js' ],
//             'backtrace': false,
//             'colors': true,
//             'snippets': true,
//             'source': true,
//             'tagExpression': 'not @wip and not @ignore',
//             'failAmbiguousDefinitions': false,
//             'ignoreUndefinedDefinitions': false
//         },
//         'onPrepare': [],
//         'before': [ null ],
//         'beforeSession': [ null ],
//         'beforeSuite': [],
//         'beforeHook': [],
//         'beforeTest': [],
//         'beforeCommand': [],
//         'afterCommand': [],
//         'afterTest': [],
//         'afterHook': [],
//         'afterSuite': [],
//         'afterSession': [],
//         'after': [],
//         'onComplete': [],
//         'onReload': [],
//         'beforeFeature': [],
//         'beforeScenario': [],
//         'beforeStep': [],
//         'afterFeature': [],
//         'afterScenario': [],
//         'afterStep': [],
//         'coloredLogs': true,
//         'services': [],
//         '_': [ '__tests__/config/wdio.browsers.conf.js' ],
//         'feature': 'failed',
//         '$0': '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/node_modules/.bin/wdio',
//         'capabilities': {
//             'browserName': 'chrome',
//             'goog:chromeOptions': {
//                 'args': [ '--headless', 'disable-infobars' ],
//                 'prefs': { 'download': { 'prompt_for_download': false, 'directory_upgrade': true, 'default_directory': './tmp' } }
//             },
//             'cjson:metadata': {
//                 'browser': { 'name': 'chrome', 'version': '58' },
//                 'device': 'MacBook Pro 15',
//                 'platform': { 'name': 'OSX', 'version': '10.12.6' }
//             }
//         }
//     },
//     'specs': [ '/Users/wimselles/Sauce/Git/webdriverio-cucumberjs/__tests__/features/failed.feature' ],
//     'sessionId': 'c1c3d5fbe0e5f2cf391868253f7f80c1',
//     'isMultiRemote': false,
//     'retry': 0,
//     'failures': 1,
//     'end': '2019-07-19T21:15:02.661Z'
// }
