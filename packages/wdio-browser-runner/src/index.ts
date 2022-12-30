import logger from '@wdio/logger'
import type { RunArgs } from '@wdio/local-runner'
import LocalRunner from '@wdio/local-runner'
import { attach } from 'webdriverio'

import type { SessionStartedMessage, SessionEndedMessage, WorkerHookResultMessage } from '@wdio/runner'
import type { Options } from '@wdio/types'

import { ViteServer } from './vite/server.js'
import { FRAMEWORK_SUPPORT_ERROR, SESSIONS, BROWSER_POOL } from './constants.js'
import { makeHeadless } from './utils.js'
import type { HookTriggerEvent } from './vite/types.js'
import type { BrowserRunnerOptions as BrowserRunnerOptionsImport } from './types.js'

const log = logger('@wdio/browser-runner')

export default class BrowserRunner extends LocalRunner {
    #config: Options.Testrunner
    #server: ViteServer

    constructor(
        private options: BrowserRunnerOptionsImport,
        protected _config: Options.Testrunner
    ) {
        super(options as never, _config)

        if (_config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }

        this.#server = new ViteServer(options)
        this.#config = _config
    }

    /**
     * nothing to initialise when running locally
     */
    async initialise() {
        log.info('Initiate browser environment')
        try {
            await this.#server.start()
            this._config.baseUrl = `http://localhost:${this.#server.config.server?.port}`
        } catch (err: any) {
            throw new Error(`Vite server failed to start: ${err.stack}`)
        }

        await super.initialise()
    }

    run (runArgs: RunArgs) {
        runArgs.caps = makeHeadless(this.options, runArgs.caps)

        if (runArgs.command === 'run') {
            runArgs.args.baseUrl = this._config.baseUrl
        }

        const worker = super.run(runArgs)
        this.#server.on('debugState', (state: boolean) => worker.postMessage('switchDebugState', state))
        this.#server.on('workerHookExecution', (payload: HookTriggerEvent) => {
            if (worker.cid !== payload.cid) {
                return
            }
            return worker.postMessage('workerHookExecution', payload)
        })
        worker.on('message', async (payload: SessionStartedMessage | SessionEndedMessage | WorkerHookResultMessage) => {
            if (payload.name === 'sessionStarted' && !SESSIONS.has(payload.cid!)) {
                SESSIONS.set(payload.cid!, {
                    args: this.#config.mochaOpts || {},
                    config: this.#config,
                    capabilities: payload.content.capabilities,
                    sessionId: payload.content.sessionId,
                    injectGlobals: payload.content.injectGlobals
                })
                const browser = await attach({
                    ...this.#config,
                    ...payload.content,
                    options: {
                        ...this.#config,
                        ...payload.content
                    }
                })
                /**
                 * propagate debug state to the worker
                 */
                BROWSER_POOL.set(payload.cid!, browser)
            }

            if (payload.name === 'sessionEnded') {
                SESSIONS.delete(payload.cid)
                BROWSER_POOL.delete(payload.cid)
            }

            if (payload.name === 'workerHookResult') {
                this.#server.resolveHook(payload.args)
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
