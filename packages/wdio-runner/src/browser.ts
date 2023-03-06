import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import { browser } from '@wdio/globals'
import { executeHooksWithArgs } from '@wdio/utils'
import type { CoverageMap } from 'istanbul-lib-coverage'
import type { Capabilities, Workers, Options, Services } from '@wdio/types'

import type BaseReporter from './reporter.js'
import type { TestFramework, HookTriggerEvent, WorkerHookResultMessage } from './types.js'

const log = logger('@wdio/runner')
const sep = '\n  - '

type WDIOErrorEvent = Partial<Pick<ErrorEvent, 'filename' | 'message' | 'error'>> & { hasViteError?: boolean }
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
        __coverage__?: unknown
    }
}

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

export default class BrowserFramework implements Omit<TestFramework, 'init'> {
    #inDebugMode = false
    #runnerOptions: any // `any` here because we don't want to create a dependency to @wdio/browser-runner

    constructor (
        private _cid: string,
        private _config: Options.Testrunner & { sessionId?: string },
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: BaseReporter
    ) {
        // listen on testrunner events
        process.on('message', this.#handleProcessMessage.bind(this))

        const [, runnerOptions] = Array.isArray(_config.runner) ? _config.runner : []
        this.#runnerOptions = runnerOptions || {}
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
        const timeout = this._config.mochaOpts!.timeout

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
                await browser.url(`/?cid=${this._cid}&spec=${url.parse(spec).pathname}`)
            }
            // await browser.debug()

            /**
             * set spec and cid as cookie so the Vite plugin can detect session even without
             * query parameters
             */
            await browser.setCookies([
                { name: 'WDIO_SPEC', value: url.fileURLToPath(spec) },
                { name: 'WDIO_CID', value: this._cid }
            ])

            /**
             * wait for test results or page errors
             */
            let state: TestState = {}
            const now = Date.now()
            await browser.waitUntil(async () => {
                while (typeof state.failures !== 'number' && (!state.errors || state.errors.length === 0)) {
                    if ((Date.now() - now) > timeout) {
                        return false
                    }

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
                                viteError = [{ message: errorElems.map((elem) => elem.innerText).join('\n') }]
                            }
                        }
                        const loadError = typeof window.__wdioErrors__ === 'undefined'
                            ?  [{ message: `Failed to load test page (title = ${document.title})` }]
                            : null
                        const errors = viteError || window.__wdioErrors__ || loadError
                        return { failures, errors, hasViteError: Boolean(viteError) }
                    }).catch((err: any) => ({ errors: [{ message: err.message }] }))
                }

                return true
            }, {
                timeoutMsg: 'browser test timed out',
                timeout
            })

            /**
             * capture coverage if enabled
             */
            if (this.#runnerOptions.coverage?.enabled && process.send) {
                const coverageMap = await browser.execute(
                    () => (window.__coverage__ || {})  as CoverageMap)
                process.send({
                    origin: 'worker',
                    name: 'coverageMap',
                    content: { coverageMap }
                })
            }

            if (state.errors?.length) {
                const errors = state.errors.map((ev) => state.hasViteError
                    ? `${ev.message}\n${(ev.error ? ev.error.split('\n').slice(1).join('\n') : '')}`
                    : `${path.basename(ev.filename || spec)}: ${ev.message}\n${(ev.error ? ev.error.split('\n').slice(1).join('\n') : '')}`)
                const { name, message, stack } = new Error(state.hasViteError
                    ? `Test failed due to the following error: ${errors.join('\n\n')}`
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

    async #fetchEvents (browser: WebdriverIO.Browser, spec: string, uid: number) {
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
