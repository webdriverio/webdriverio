import type { RunCommandArguments } from '../types.js'
import type { Options, Capabilities } from '@wdio/types'
import logger from '@wdio/logger'

const log = logger('@wdio/cli:launcher')

export class Launcher {

    #esmLauncher: any

    constructor(
        private configFilePath: string,
        private args: Partial<RunCommandArguments> = {},
        private isWatchMode = false
    ) {
        import('../launcher.js').then(launcher => {
            log.info('Initializing main Launcher')
            this.#esmLauncher = new launcher.default(this.configFilePath, this.args, this.isWatchMode)
            return this.#esmLauncher
        })
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolved with either an exitCode or an error
     */
    async run(): Promise<undefined | number> {
        return this.#esmLauncher.run()
    }

    /**
     * run without triggering onPrepare/onComplete hooks
     */
    runMode (config: Required<Options.Testrunner>, caps: Capabilities.RemoteCapabilities): Promise<number> {
        return this.#esmLauncher.runMode(config, caps)
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
        this.#esmLauncher.startInstance(specs, caps, cid, rid, retries)
    }

}

export async function run(): Promise<false | void> {
    const { run } = await import('../index.js')
    return run()
}
