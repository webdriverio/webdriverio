import type { Capabilities, Options } from '@wdio/types'
import {
    type Argument,
    type HookStats,
    type RunnerStats,
    type SuiteStats,
    type Tag,
    type TestStats
} from '@wdio/reporter'
import type { WriteStream } from 'node:fs'
import type { cjson_metadata } from '../types.js'

export interface W3CCapabilitiesExtended extends Capabilities.W3CCapabilities {
    'cjson:metadata'?: cjson_metadata
    app?: string
}

export interface DesiredCapabilitiesExtended extends WebdriverIO.Capabilities {
    'cjson:metadata'?: cjson_metadata
    app?: string
}

export interface TestrunnerExtended extends Options.Testrunner {
    jsonFolder?: string
    language?: string
    'cjson:metadata'?: cjson_metadata
    logFile?: string
    stdout?: boolean
    writeStream?: WriteStream
}
export interface WebdriverIOExtended extends Options.WebdriverIO {
    app?: string
    requestedCapabilities?: {
        'cjson:metadata'?: cjson_metadata
        w3cCaps: {
            alwaysMatch?: Record<string, unknown>
        }
    }
}

export interface HookStatsExtended extends HookStats {
    description?: string
    tags?: string[] | Tag[] | string
    keyword?: string
    argument?: Argument
    line?: number
    name?: string
}

export interface TestStatsExtended extends TestStats {
    description?: string
    tags?: string[] | Tag[] | string
    keyword?: string
    name?: string
    id?: string
}

export interface RunnerStatsExtended extends RunnerStats {
    metadata?: Record<string, unknown>
}

export interface SuiteStatsExtended extends SuiteStats {
    keyword?: string
    line?: number
    name?: string
    id?: string
}

export interface ConfigCapabilities {
    browserName?: string
    'cjson:metadata'?: {
        device?: string
        browser?: {
            name?: string
            version?: string
        }
        platform?: {
            name?: string
            version?: string
        }
    }
}
