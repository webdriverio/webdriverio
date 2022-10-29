import logger from '@wdio/logger'
import getPort from 'get-port'
import { createServer, ViteDevServer } from 'vite'
import { remote, Browser } from 'webdriverio'
import type { Capabilities, Options } from '@wdio/types'

import Session from './worker.js'
import { BROWSER_POOL, FRAMEWORK_SUPPORT_ERROR } from './constants.js'
import { getViteConfig } from './utils.js'
import type { RunArgs, BrowserRunnerOptions as BrowserRunnerOptionsImport } from './types'

const log = logger('@wdio/browser-runner')

export default class BrowserRunner {
    #options: WebdriverIO.BrowserRunnerOptions
    #config: Options.Testrunner
    #server?: ViteDevServer

    constructor(
        options: WebdriverIO.BrowserRunnerOptions,
        config: Options.Testrunner
    ) {
        this.#config = config
        this.#options = options

        if (this.#config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }
    }

    /**
     * nothing to initialise when running locally
     */
    async initialise() {
        const rootDir = this.#options.rootDir || process.cwd()
        log.info('Initiate browser environment')
        try {
            const port = await getPort()
            const viteConfig = await getViteConfig(this.#options, rootDir, port)
            this.#server = await createServer(viteConfig)
            await this.#server.listen()
            log.info(`Vite server started successfully on port ${port}, root directory: ${rootDir}`)
        } catch (err: any) {
            throw new Error(`Vite server failed to start: ${err.stack}`)
        }
    }

    getWorkerCount() {
        return Object.keys(BROWSER_POOL).length
    }

    run(args: RunArgs) {
        if (!(args.caps as Capabilities.Capabilities).browserName) {
            throw new Error('Multiremote capabilities are not supported when running in the browser')
        }

        if (!this.#server) {
            throw new Error('Vite server didn\'t start')
        }

        if (!BROWSER_POOL.has(args.args.capabilityId)) {
            BROWSER_POOL.set(args.args.capabilityId, this.#initSession(args))
        }

        const browser = BROWSER_POOL.get(args.args.capabilityId)
        if (!browser) {
            throw new Error(`No browser found with id ${args.args.capabilityId}`)
        }

        const session = new Session(this.#config, args, this.#server)
        session.run(browser)
        return session
    }

    #initSession(args: RunArgs): Promise<Browser<'async'>> {
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

    async closeSession(cid: number) {
        const browser = await BROWSER_POOL.get(cid)
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
    async shutdown() {
        if (this.#server) {
            log.info('Shutting down Vite server')
            await this.#server.close()
        }
    }
}

declare global {
    namespace WebdriverIO {
        interface BrowserRunnerOptions extends BrowserRunnerOptionsImport {}
    }
}
