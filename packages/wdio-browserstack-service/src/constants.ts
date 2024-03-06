import type { BrowserstackConfig } from './types.js'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { version: bstackServiceVersion } = require('../package.json')

export const BROWSER_DESCRIPTION = [
    'device',
    'os',
    'osVersion',
    'os_version',
    'browserName',
    'browser',
    'browserVersion',
    'browser_version'
] as const

export const VALID_APP_EXTENSION = [
    '.apk',
    '.aab',
    '.ipa'
]

export const DEFAULT_OPTIONS: Partial<BrowserstackConfig> = {
    setSessionName: true,
    setSessionStatus: true,
    testObservability: true,
    accessibility: false
}

export const consoleHolder: typeof console = Object.assign({}, console)

export const DATA_ENDPOINT = 'https://collector-observability.browserstack.com'
export const DATA_EVENT_ENDPOINT = 'api/v1/event'
export const DATA_BATCH_ENDPOINT = 'api/v1/batch'
export const DATA_SCREENSHOT_ENDPOINT = 'api/v1/screenshots'
export const DATA_BATCH_SIZE = 1000
export const DATA_BATCH_INTERVAL = 2000
export const BATCH_EVENT_TYPES = ['LogCreated', 'TestRunStarted', 'TestRunFinished', 'HookRunFinished', 'HookRunStarted', 'ScreenshotCreated']
export const DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS = 5000 // 5s
export const DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS = 100 // 100ms
export const BSTACK_SERVICE_VERSION = bstackServiceVersion

export const ACCESSIBILITY_API_URL = 'https://accessibility.browserstack.com/api'
export const NOT_ALLOWED_KEYS_IN_CAPS = ['includeTagsInTestingScope', 'excludeTagsInTestingScope']

export const LOGS_FILE = 'logs/bstack-wdio-service.log'
export const UPLOAD_LOGS_ADDRESS = 'https://upload-observability.browserstack.com'
export const UPLOAD_LOGS_ENDPOINT = 'client-logs/upload'

export const PERCY_LOGS_FILE = 'logs/percy.log'

export const PERCY_DOM_CHANGING_COMMANDS_ENDPOINTS = [
    '/session/:sessionId/url',
    '/session/:sessionId/forward',
    '/session/:sessionId/back',
    '/session/:sessionId/refresh',
    '/session/:sessionId/screenshot',
    '/session/:sessionId/actions',
    '/session/:sessionId/appium/device/shake'
]

export const CAPTURE_MODES = ['click', 'auto', 'screenshot', 'manual', 'testcase']

export const LOG_KIND_USAGE_MAP = {
    'TEST_LOG': 'log',
    'TEST_SCREENSHOT': 'screenshot',
    'TEST_STEP': 'step',
    'HTTP': 'http'
}

export const FUNNEL_INSTRUMENTATION_URL = 'https://api.browserstack.com/sdk/v1/event'

// Env variables - Define all the env variable constants over here

// To store the JWT token returned the session launch
export const TESTOPS_JWT_ENV = 'BS_TESTOPS_JWT'

// To store the setting of whether to send screenshots or not
export const TESTOPS_SCREENSHOT_ENV = 'BS_TESTOPS_ALLOW_SCREENSHOTS'

// To store build hashed id
export const TESTOPS_BUILD_ID_ENV = 'BS_TESTOPS_BUILD_HASHED_ID'

// Whether to collect performance instrumentation or not
export const PERF_MEASUREMENT_ENV = 'BROWSERSTACK_O11Y_PERF_MEASUREMENT'

// Whether the current run is rerun or not
export const RERUN_TESTS_ENV = 'BROWSERSTACK_RERUN_TESTS'

// The tests that needs to be rerun
export const RERUN_ENV = 'BROWSERSTACK_RERUN'

// To store whether the build launch has completed or not
export const TESTOPS_BUILD_COMPLETED_ENV = 'BS_TESTOPS_BUILD_COMPLETED'
