import RunnableStats from './runnable'
import sanitize from '../utils'

/**
 * Class to capture statistics about a test run. A test run is a single instance that
 * runs one or more spec files
 */
export default class RunnerStats extends RunnableStats {
    constructor (runner) {
        super('runner')
        this.uid = this.getIdentifier(runner)
        this.cid = runner.cid
        this.capabilities = runner.capabilities
        this.sanitizedCapabilities = runner.capabilities && sanitize.caps(runner.capabilities)
        this.config = runner.config
        this.specs = {}
    }
}
