import type { Browser } from 'webdriverio'
import type { Environment } from './types'

export const SESSIONS = new Map<string, Environment>()
export const BROWSER_POOL: Map<string, Browser<'async'>> = new Map()

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
