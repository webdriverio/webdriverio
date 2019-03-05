import RunnableStats from './runnable'
import { sanitizeCaps } from '../utils'

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
export default class RunnerStats extends RunnableStats {
    constructor (runner) {
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
