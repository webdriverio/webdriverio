import logger from '@wdio/logger'
import getPort from 'get-port'
import { createServer, ViteDevServer } from 'vite'
import type { Capabilities, Options } from '@wdio/types'

import SessionWorker from './worker.js'
import { testrunner } from './plugins/testrunner.js'
import type { RunArgs } from './types'

const log = logger('@wdio/browser-runner')

export default class LocalRunner {
    #config: Options.Testrunner
    #server?: ViteDevServer
    sessionPool: Record<string, SessionWorker> = {}

    constructor (
        configFile: unknown,
        config: Options.Testrunner
    ) {
        this.#config = config
    }

    /**
     * nothing to initialise when running locally
     */
    async initialise () {
        log.info('Initiate browser environment')
        try {
            const port = await getPort()
            this.#server = await createServer({
                configFile: false,
                root: process.cwd(),
                server: { port, host: 'localhost' },
                plugins: [
                    testrunner()
                ]
            })
            await this.#server.listen()
            log.info(`Vite server started successfully on port ${port}, root directory: ${process.cwd()}`)
        } catch (err: any) {
            log.error(`Vite server failed to start: ${err.message}`)
        }
    }

    getWorkerCount () {
        return Object.keys(this.sessionPool).length
    }

    async run (args: RunArgs) {
        if (!(args.caps as Capabilities.Capabilities).browserName) {
            throw new Error('Multiremote capabilities are not supported when running in the browser')
        }

        if (!this.#server) {
            throw new Error('Vite server didn\'t start')
        }

        const worker = this.sessionPool[args.cid] = new SessionWorker(this.#config, args, this.#server)
        worker.run()
        return worker
    }

    /**
     * shutdown vite server
     *
     * @return {Promise}  resolves when vite server has been shutdown
     */
    async shutdown () {
        if (this.#server) {
            log.info('Shutting down browser session')
            await this.#server.close()
        }
    }
}
