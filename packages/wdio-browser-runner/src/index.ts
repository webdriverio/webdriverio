import logger from '@wdio/logger'
import getPort from 'get-port'
import vue from '@vitejs/plugin-vue'
import { createServer, ViteDevServer } from 'vite'
import { remote, Browser } from 'webdriverio'
import type { Capabilities, Options } from '@wdio/types'

import SessionWorker from './worker.js'
import { testrunner } from './plugins/testrunner.js'
import type { RunArgs } from './types'

const log = logger('@wdio/browser-runner')

export default class LocalRunner {
    #config: Options.Testrunner
    #server?: ViteDevServer
    $browserPool: Map<number, Promise<Browser<'async'>>> = new Map()

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
        const root = process.cwd()

        log.info('Initiate browser environment')
        try {
            const port = await getPort()
            this.#server = await createServer({
                configFile: false,
                root,
                server: { port, host: 'localhost' },
                plugins: [
                    testrunner(root),
                    vue()
                ]
            })
            await this.#server.listen()
            log.info(`Vite server started successfully on port ${port}, root directory: ${root}`)
        } catch (err: any) {
            log.error(`Vite server failed to start: ${err.message}`)
        }
    }

    getWorkerCount () {
        return Object.keys(this.$browserPool).length
    }

    async run (args: RunArgs) {
        if (!(args.caps as Capabilities.Capabilities).browserName) {
            throw new Error('Multiremote capabilities are not supported when running in the browser')
        }

        if (!this.#server) {
            throw new Error('Vite server didn\'t start')
        }

        if (!this.$browserPool.has(args.args.capabilityId)) {
            this.$browserPool.set(args.args.capabilityId, this.#initSession(args))
        }

        const browser = this.$browserPool.get(args.args.capabilityId)
        if (!browser) {
            throw new Error(`No browser found with id ${args.args.capabilityId}`)
        }

        const worker = new SessionWorker(this.#config, args, this.#server)
        worker.run(browser)
        return worker
    }

    #initSession (args: RunArgs): Promise<Browser<'async'>> {
        try {
            log.info('Initiate browser session')
            return remote({
                capabilities: args.caps,
                baseUrl: `http://localhost:${this.#server!.config.server.port}`
            })
        } catch (err: any) {
            throw new Error(`Failed to start browser session with cid: ${err.message}`)
        }
    }

    async closeSession (cid: number) {
        const browser = await this.$browserPool.get(cid)
        if (!browser) {
            return
        }
        log.info(`Shutdown browser with session ${browser.sessionId}`)
        await browser.deleteSession()
    }

    /**
     * shutdown vite server
     *
     * @return {Promise}  resolves when vite server has been shutdown
     */
    async shutdown () {
        if (this.#server) {
            log.info('Shutting down Vite server')
            await this.#server.close()
        }
    }
}
