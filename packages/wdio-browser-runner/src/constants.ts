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
    hookResultMessage
}

export const DEFAULT_INCLUDE = ['**']
export const DEFAULT_FILE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte']
export const DEFAULT_REPORTS_DIRECTORY = 'coverage'
export const DEFAULT_MOCK_DIRECTORY = '__mocks__'
export const SUMMARY_REPORTER = 'json-summary'
export const COVERAGE_FACTORS = ['lines', 'functions', 'branches', 'statements'] as const
export const DEFAULT_COVERAGE_REPORTS: (keyof ReportOptions)[] = ['text', 'html', 'clover', SUMMARY_REPORTER]
export const GLOBAL_TRESHOLD_REPORTING = 'ERROR: Coverage for %s (%s%) does not meet global threshold (%s%)'
export const FILE_TRESHOLD_REPORTING = 'ERROR: Coverage for %s (%s%) does not meet threshold (%s%) for %s'
