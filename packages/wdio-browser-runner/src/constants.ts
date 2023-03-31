import type { Environment } from './types.js'
import type { ReportOptions } from 'istanbul-reports'

export const SESSIONS = new Map<string, Environment>()
export const BROWSER_POOL: Map<string, WebdriverIO.Browser> = new Map()

export const EVENTS = {
    'suite': 'suite:start',
    'suite end': 'suite:end',
    'test': 'test:start',
    'test end': 'test:end',
    'hook': 'hook:start',
    'hook end': 'hook:end',
    'pass': 'test:pass',
    'fail': 'test:fail',
    'retry': 'test:retry',
    'pending': 'test:pending'
} as const

export const FRAMEWORK_SUPPORT_ERROR = 'Currently only "mocha" is supported as framework when using @wdio/browser-runner.'

export enum MESSAGE_TYPES {
    consoleMessage = 0,
    commandRequestMessage,
    commandResponseMessage,
    hookTriggerMessage,
    hookResultMessage,
    mockRequest,
    mockResponse
}

export const DEFAULT_INCLUDE = ['**']
export const DEFAULT_FILE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']
export const DEFAULT_REPORTS_DIRECTORY = 'coverage'
export const DEFAULT_AUTOMOCK = true
export const DEFAULT_MOCK_DIRECTORY = '__mocks__'
export const SUMMARY_REPORTER = 'json-summary'
export const COVERAGE_FACTORS = ['lines', 'functions', 'branches', 'statements'] as const
export const DEFAULT_COVERAGE_REPORTS: (keyof ReportOptions)[] = ['text', 'html', 'clover', SUMMARY_REPORTER]
export const GLOBAL_TRESHOLD_REPORTING = 'ERROR: Coverage for %s (%s%) does not meet global threshold (%s%)'
export const FILE_TRESHOLD_REPORTING = 'ERROR: Coverage for %s (%s%) does not meet threshold (%s%) for %s'

export const MOCHA_VARIABELS = /*css*/`:root {
    --mocha-color: #000;
    --mocha-bg-color: #fff;
    --mocha-pass-icon-color: #00d6b2;
    --mocha-pass-color: #fff;
    --mocha-pass-shadow-color: rgba(0, 0, 0, .2);
    --mocha-pass-mediump-color: #c09853;
    --mocha-pass-slow-color: #b94a48;
    --mocha-test-pending-color: #0b97c4;
    --mocha-test-pending-icon-color: #0b97c4;
    --mocha-test-fail-color: #c00;
    --mocha-test-fail-icon-color: #c00;
    --mocha-test-fail-pre-color: #000;
    --mocha-test-fail-pre-error-color: #c00;
    --mocha-test-html-error-color: #000;
    --mocha-box-shadow-color: #eee;
    --mocha-box-bottom-color: #ddd;
    --mocha-test-replay-color: #000;
    --mocha-test-replay-bg-color: #eee;
    --mocha-stats-color: #888;
    --mocha-stats-em-color: #000;
    --mocha-stats-hover-color: #eee;
    --mocha-error-color: #c00;

    --mocha-code-comment: #ddd;
    --mocha-code-init: #2f6fad;
    --mocha-code-string: #5890ad;
    --mocha-code-keyword: #8a6343;
    --mocha-code-number: #2f6fad;
}

@media (prefers-color-scheme: dark) {
    :root {
        --mocha-color: #fff;
        --mocha-bg-color: #222;
        --mocha-pass-icon-color: #00d6b2;
        --mocha-pass-color: #222;
        --mocha-pass-shadow-color: rgba(255, 255, 255, .2);
        --mocha-pass-mediump-color: #f1be67;
        --mocha-pass-slow-color: #f49896;
        --mocha-test-pending-color: #0b97c4;
        --mocha-test-pending-icon-color: #0b97c4;
        --mocha-test-fail-color: #f44;
        --mocha-test-fail-icon-color: #f44;
        --mocha-test-fail-pre-color: #fff;
        --mocha-test-fail-pre-error-color: #f44;
        --mocha-test-html-error-color: #fff;
        --mocha-box-shadow-color: #444;
        --mocha-box-bottom-color: #555;
        --mocha-test-replay-color: #fff;
        --mocha-test-replay-bg-color: #444;
        --mocha-stats-color: #aaa;
        --mocha-stats-em-color: #fff;
        --mocha-stats-hover-color: #444;
        --mocha-error-color: #f44;

        --mocha-code-comment: #ddd;
        --mocha-code-init: #9cc7f1;
        --mocha-code-string: #80d4ff;
        --mocha-code-keyword: #e3a470;
        --mocha-code-number: #4ca7ff;
    }
}
`
