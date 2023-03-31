import type { Capabilities, Options } from '@wdio/types'

import RunnableStats from './runnable.js'
import { sanitizeCaps } from '../utils.js'

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
export default class RunnerStats extends RunnableStats {
    cid: string
    capabilities: Capabilities.RemoteCapability
    sanitizedCapabilities: string
    config: Options.Testrunner
    specs: string[]
    sessionId: string
    isMultiremote: boolean
    instanceOptions: Record<string, Options.WebdriverIO>
    retry?: number
    failures?: number
    retries?: number

    constructor (runner: Options.RunnerStart) {
        super('runner')
        this.cid = runner.cid
        this.capabilities = runner.capabilities
        this.sanitizedCapabilities = sanitizeCaps(runner.capabilities)
        this.config = runner.config
        this.specs = runner.specs
        this.sessionId = runner.sessionId
        this.isMultiremote = runner.isMultiremote
        this.instanceOptions = runner.instanceOptions
        this.retry = runner.retry
    }
}
