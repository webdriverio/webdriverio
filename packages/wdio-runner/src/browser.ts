import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import { browser } from '@wdio/globals'
import { executeHooksWithArgs } from '@wdio/utils'
import type { Browser } from 'webdriverio'
import type { Capabilities, Workers, Options, Services } from '@wdio/types'

import type BaseReporter from './reporter.js'
import type { TestFramework, HookTriggerEvent, WorkerHookResultMessage } from './types.js'

const log = logger('@wdio/runner')
const sep = '\n  - '

type WDIOErrorEvent = Partial<Pick<ErrorEvent, 'filename' | 'message'>> & { hasViteError?: boolean }
interface TestState {
    failures?: number | null
    errors?: WDIOErrorEvent[]
    hasViteError?: boolean
}

declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
        __wdioEvents__: any[]
        __wdioFailures__: number
    }
}

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

export default class BrowserFramework implements Omit<TestFramework, 'init'> {
    #inDebugMode = false

    constructor (
        private _cid: string,
        private _config: Options.Testrunner & { sessionId?: string },
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: BaseReporter
    ) {
        // listen on testrunner events
        process.on('message', this.#handleProcessMessage.bind(this))
    }

    /**
     * always return true as it is unrelevant for component testing
     */
    hasTests () {
        return true
    }

    init () {
        return undefined as any as TestFramework
    }

    async run () {
        try {
            const failures = await this.#loop()
            return failures
        } catch (err: any) {
            if ((err as Error).message.includes('net::ERR_CONNECTION_REFUSE')) {
                err.message = `Failed to load test page to run tests, make sure your browser can access "${browser.options.baseUrl}"`
            }

            log.error(`Failed to run browser tests with cid ${this._cid}: ${err.stack}`)
            process.send!({
                origin: 'worker',
                name: 'error',
                content: { name: err.name, message: err.message, stack: err.stack }
            })
            return 1
        }
    }

    async #loop () {
        /**
         * start tests
         */
        let failures = 0

        let uid = 0
        for (const spec of this._specs) {
            log.info(`Run spec file ${spec} for cid ${this._cid}`)

            /**
             * if a `sessionId` is part of `this._config` it means we are in watch mode and are
             * re-using a previous session. Since Vite has already a hotreload feature, there
             * is no need to call the url command again
             */
            if (!this._config.sessionId) {
                await browser.url(`/${this._cid}/test.html?spec=${url.fileURLToPath(spec)}`)
            }
            // await browser.debug()

            /**
             * wait for test results or page errors
             */
            let state: TestState = {}
            await browser.waitUntil(async () => {
                while (typeof state.failures !== 'number' && (!state.errors || state.errors.length === 0)) {
                    await sleep()

                    /**
                     * don't fetch events if user has called debug command
                     */
                    if (this.#inDebugMode) {
                        continue
                    }

                    state = await browser?.execute(function fetchExecutionState () {
                        const failures = window.__wdioEvents__ && window.__wdioEvents__.length > 0
                            ? window.__wdioFailures__
                            : null
                        let viteError
                        const viteErrorElem = document.querySelector('vite-error-overlay')
                        if (viteErrorElem && viteErrorElem.shadowRoot) {
                            const errorElems = Array.from(viteErrorElem.shadowRoot.querySelectorAll('pre'))
                            if (errorElems.length) {
                                viteError = errorElems.map((elem) => ({ message: elem.innerText }))
                            }
                        }
                        const loadError = typeof window.__wdioErrors__ === 'undefined'
                            ?  [{ message: 'Failed to load test page' }]
                            : null
                        const errors = viteError || window.__wdioErrors__ || loadError
                        return { failures, errors, hasViteError: Boolean(viteError) }
                    }).catch((err: any) => ({ errors: [{ message: err.message }] }))
                }

                return true
            }, {
                timeoutMsg: 'browser test timed out',
                timeout: 15 * 1000
            })

            if (state.errors?.length) {
                const errors = state.errors.map((ev) => state.hasViteError
                    ? ev.message
                    : `${path.basename(ev.filename || spec)}: ${ev.message}`)
                const { name, message, stack } = new Error(state.hasViteError
                    ? `Test failed due to the following error: ${errors.join('\n')}`
                    : `Test failed due to following error(s):${sep}${errors.join(sep)}`)
                process.send!({
                    origin: 'worker',
                    name: 'error',
                    content: { name, message, stack }
                })
                failures += 1
                continue
            }

            await this.#fetchEvents(browser, spec, ++uid)
            failures += state.failures || 0
        }

        return failures
    }

    async #fetchEvents (browser: Browser<'async'>, spec: string, uid: number) {
        /**
         * populate events to the reporter
         */
        const events = await browser.execute(() => window.__wdioEvents__)
        for (const ev of events) {
            if ((ev.type === 'suite:start' || ev.type === 'suite:end') && ev.title === '') {
                continue
            }
            this._reporter.emit(ev.type, {
                ...ev,
                file: spec,
                uid: `${this._cid}-${uid}`,
                cid: this._cid
            })
        }
    }

    async #handleProcessMessage (cmd: Workers.WorkerCommand) {
        if (cmd.command === 'switchDebugState') {
            this.#inDebugMode = cmd.args
            return
        }
        if (cmd.command === 'workerHookExecution') {
            const args = cmd.args as HookTriggerEvent
            await executeHooksWithArgs(args.name, this._config[args.name as keyof Services.HookFunctions], args.args)
                .catch((err) => log.warn(`Failed running "${args.name}" hook for cid ${args.cid}: ${err.message}`))
            return process.send!(<WorkerHookResultMessage>{
                origin: 'worker',
                name: 'workerHookResult',
                args
            })
        }
    }

    static init (cid: string, config: any, specs: string[], caps: Capabilities.RemoteCapability, reporter: BaseReporter) {
        const framework = new BrowserFramework(cid, config, specs, caps, reporter)
        return framework
    }
}
