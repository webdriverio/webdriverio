import type { Capabilities, Options } from '@wdio/types'

import RunnableStats from './runnable.js'
import { sanitizeCaps } from '../utils.js'

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
export default class RunnerStats extends RunnableStats {
    cid: string
    capabilities: Capabilities.ResolvedTestrunnerCapabilities
    sanitizedCapabilities: string
    config: Options.Testrunner
    specs: string[]
    sessionId: string
    isMultiRemote: boolean
    instanceOptions: Record<string, Options.WebdriverIO>
    retry?: number
    failures?: number
    retries?: number
    error?: string

    constructor (runner: Options.RunnerStart) {
        super('runner')
        this.cid = runner.cid
        this.capabilities = runner.capabilities
        this.sanitizedCapabilities = sanitizeCaps(runner.capabilities)
        this.config = runner.config
        this.specs = runner.specs
        this.sessionId = runner.sessionId
        this.isMultiRemote = runner.isMultiRemote
        this.instanceOptions = runner.instanceOptions
        this.retry = runner.retry
    }

    /**
     * The attempt of the spec file with `specFileRetries`: 0 for the first one. `retry` is the runner value:
     * `specFileRetries + 1` for the first attempt (the launcher does not know the retries yet), and 1 with
     * no retries. In watch mode (retries 0) the only run gets `specFileRetries`.
     */
    get specFileAttempt (): number {
        const specFileRetries = this.config?.specFileRetries ?? 0
        const retry = this.retry ?? 0
        return specFileRetries && retry <= specFileRetries ? retry : 0
    }
}
