import type { RunCommandArguments } from '../types.js'
import type { Options, Capabilities } from '@wdio/types'
import type { EndMessage } from '../launcher.js'

export class Launcher {

    esmLauncher: any

    constructor(
        private configFilePath: string,
        private args: Partial<RunCommandArguments> = {},
        private isWatchMode = false
    ) {
        import('../index.js').then(esmModule => this.esmLauncher = new esmModule.Launcher(this.configFilePath, this.args, this.isWatchMode))
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolves with either an exitCode or an error
     */
    async run() {
        return this.esmLauncher.run()
    }

    /**
     * run without triggering onPrepare/onComplete hooks
     */
    runMode (config: Required<Options.Testrunner>, caps: Capabilities.RemoteCapabilities): Promise<number> {
        return this.esmLauncher.runMode(config, caps)
    }

    /**
     * Format the specs into an array of objects with files and retries
     */
    formatSpecs(capabilities: (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities | Capabilities.RemoteCapabilities), specFileRetries: number) {
        this.esmLauncher.formatSpecs(capabilities, specFileRetries)
    }

    /**
     * run multiple single remote tests
     * @return {Boolean} true if all specs have been run and all instances have finished
     */
    runSpecs() {
        return this.esmLauncher.runSpecs()
    }

    /**
     * gets number of all running instances
     * @return {number} number of running instances
     */
    getNumberOfRunningInstances() {
        return this.esmLauncher.getNumberOfRunningInstances()
    }

    /**
     * get number of total specs left to complete whole suites
     * @return {number} specs left to complete suite
     */
    getNumberOfSpecsLeft() {
        return this.esmLauncher.getNumberOfSpecsLeft()
    }

    /**
     * Start instance in a child process.
     * @param  {Array} specs  Specs to run
     * @param  {Number} cid  Capabilities ID
     * @param  {String} rid  Runner ID override
     * @param  {Number} retries  Number of retries remaining
     */
    async startInstance(
        specs: string[],
        caps: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities | Capabilities.MultiRemoteCapabilities,
        cid: number,
        rid: string | undefined,
        retries: number
    ) {
        this.esmLauncher.startInstance(specs, caps, cid, rid, retries)
    }

    /**
     * generates a runner id
     * @param  {Number} cid capability id (unique identifier for a capability)
     * @return {String}     runner id (combination of cid and test id e.g. 0a, 0b, 1a, 1b ...)
     */
    getRunnerId (cid: number) {
        return this.esmLauncher.getRunnerId(cid)
    }

    /**
     * Close test runner process once all child processes have exited
     * @param  {Number} cid       Capabilities ID
     * @param  {Number} exitCode  exit code of child process
     * @param  {Array} specs      Specs that were run
     * @param  {Number} retries   Number or retries remaining
     */
    async endHandler({ cid: rid, exitCode, specs, retries }: EndMessage) {
        return this.esmLauncher.endHandler({ cid: rid, exitCode, specs, retries })
    }

    /**
     * We need exitHandler to catch SIGINT / SIGTERM events.
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler (callback?: (value: boolean) => void) {
        return this.esmLauncher.exitHandler(callback)
    }

}

exports.run = async function(): Promise<false | void> {
    const { run } = await import('../index.js')
    return run()
}
