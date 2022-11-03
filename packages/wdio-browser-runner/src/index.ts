import logger from '@wdio/logger'
import getPort from 'get-port'
import LocalRunner, { RunArgs } from '@wdio/local-runner'
import { attach } from 'webdriverio'
import { createServer, ViteDevServer } from 'vite'
import type { SessionStartedMessage, SessionEndedMessage } from '@wdio/runner'
import type { Options } from '@wdio/types'

import { FRAMEWORK_SUPPORT_ERROR, SESSIONS, BROWSER_POOL } from './constants.js'
import { getViteConfig } from './utils.js'
import type { BrowserRunnerOptions as BrowserRunnerOptionsImport } from './types'

const log = logger('@wdio/browser-runner')

export default class BrowserRunner extends LocalRunner {
    #options: BrowserRunnerOptionsImport
    #config: Options.Testrunner
    #server?: ViteDevServer

    constructor(private options: BrowserRunnerOptionsImport, private config: Options.Testrunner) {
        super(options as never, config)

        if (config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }

        this.#options = options
        this.#config = config
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

        await super.initialise()
    }

    run (runArgs: RunArgs) {
        if (runArgs.command === 'run') {
            runArgs.args.baseUrl = `http://localhost:${this.#server?.config.server.port}`
        }

        const worker = super.run(runArgs)
        worker.on('message', async (payload: SessionStartedMessage | SessionEndedMessage) => {
            if (payload.name === 'sessionStarted') {
                SESSIONS.set(payload.cid!, {
                    args: this.#config.mochaOpts || {},
                    capabilities: payload.content.capabilities,
                    sessionId: payload.content.sessionId,
                    injectGlobals: payload.content.injectGlobals
                })
                BROWSER_POOL.set(payload.cid!, await attach({
                    sessionId: payload.content.sessionId,
                    options: this.#config,
                    capabilities: payload.content.capabilities
                }))
            }

            if (payload.name === 'sessionEnded') {
                SESSIONS.delete(payload.cid)
                BROWSER_POOL.delete(payload.cid)
            }
        })
        return worker
    }

    /**
     * shutdown vite server
     *
     * @return {Promise}  resolves when vite server has been shutdown
     */
    async shutdown() {
        await super.shutdown()
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
