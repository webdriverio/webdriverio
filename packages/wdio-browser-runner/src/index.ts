import logger from '@wdio/logger'
import LocalRunner, { RunArgs } from '@wdio/local-runner'
import { attach } from 'webdriverio'

import type { SessionStartedMessage, SessionEndedMessage } from '@wdio/runner'
import type { Options } from '@wdio/types'

import { ViteServer } from './vite/server.js'
import { FRAMEWORK_SUPPORT_ERROR, SESSIONS, BROWSER_POOL } from './constants.js'
import type { BrowserRunnerOptions as BrowserRunnerOptionsImport } from './types'

const log = logger('@wdio/browser-runner')

export default class BrowserRunner extends LocalRunner {
    #config: Options.Testrunner
    #server: ViteServer

    constructor(options: BrowserRunnerOptionsImport, config: Options.Testrunner) {
        super(options as never, config)

        if (config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }

        this.#server = new ViteServer(options)
        this.#config = config
    }

    /**
     * nothing to initialise when running locally
     */
    async initialise() {
        log.info('Initiate browser environment')
        try {
            await this.#server.start()
        } catch (err: any) {
            throw new Error(`Vite server failed to start: ${err.stack}`)
        }

        await super.initialise()
    }

    run (runArgs: RunArgs) {
        if (runArgs.command === 'run') {
            runArgs.args.baseUrl = `http://localhost:${this.#server.config.server?.port}`
        }

        const worker = super.run(runArgs)
        worker.on('message', async (payload: SessionStartedMessage | SessionEndedMessage) => {
            if (payload.name === 'sessionStarted') {
                SESSIONS.set(payload.cid!, {
                    args: this.#config.mochaOpts || {},
                    config: this.#config,
                    capabilities: payload.content.capabilities,
                    sessionId: payload.content.sessionId,
                    injectGlobals: payload.content.injectGlobals
                })
                BROWSER_POOL.set(payload.cid!, await attach({
                    ...this.#config,
                    ...payload.content
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
        await this.#server.close()
    }
}

declare global {
    namespace WebdriverIO {
        interface BrowserRunnerOptions extends BrowserRunnerOptionsImport {}
    }
}
