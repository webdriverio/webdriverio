import type { Capabilities } from '@wdio/types'

import RunnableStats from './runnable'
import { sanitizeCaps } from '../utils'
import { WDIOReporterOptions } from '..'

export interface Runner {
    cid: string
    specs: string[]
    config: WDIOReporterOptions
    isMultiremote: boolean
    sessionId?: string
    capabilities: Capabilities.Capabilities
    retry?: number
    failures?: number
    retries?: number
}

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
export default class RunnerStats extends RunnableStats {
    cid: string
    capabilities: Capabilities.Capabilities
    sanitizedCapabilities: string
    config: WDIOReporterOptions
    specs: string[]
    sessionId?: string
    isMultiremote: boolean
    retry?: number
    failures?: number
    retries?: number

    constructor (runner: Runner) {
        super('runner')
        this.cid = runner.cid
        this.capabilities = runner.capabilities
        this.sanitizedCapabilities = sanitizeCaps(runner.capabilities)
        this.config = runner.config
        this.specs = runner.specs
        this.sessionId = runner.sessionId
        this.isMultiremote = runner.isMultiremote
        this.retry = runner.retry
    }
}
