import url from 'node:url'
import path from 'node:path'

import type { ChainablePromiseArray } from 'webdriverio'
import logger from '@wdio/logger'
import { browser } from '@wdio/globals'
import { executeHooksWithArgs } from '@wdio/utils'
import { matchers } from 'expect-webdriverio'
import { ELEMENT_KEY } from 'webdriver'
import type {
    AnyWSMessage,
    LogMessage,
    TestState,
    WDIOErrorEvent,
    WSMessage,
    WSMessageValue
} from '@wdio/types'
import {
    type Services,
    WS_MESSAGE_TYPES,
} from '@wdio/types'

import { createClientRpc } from '@wdio/rpc'
import type { ServerFunctions, ClientFunctions, RunnerRpcInstance } from '@wdio/rpc'

import type { CoverageMapData } from 'istanbul-lib-coverage'
import { transformExpectArgs } from './utils.js'
import type BaseReporter from './reporter.js'
import type { TestFramework } from './types.js'

const log = logger('@wdio/runner')
const sep = '\n  - '
const ERROR_CHECK_INTERVAL = 500
const DEFAULT_TIMEOUT = 60 * 1000

declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
        __wdioEvents__: Event[]
        __wdioFailures__: number
        __coverage__?: unknown
    }
}

export default class BrowserFramework implements Omit<TestFramework, 'init'> {
    #retryOutdatedOptimizeDep = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #runnerOptions: any // `any` here because we don't want to create a dependency to @wdio/browser-runner
    #resolveTestStatePromise?: (value: TestState) => void
    private _rpc: RunnerRpcInstance

    constructor (
        private _cid: string,
        private _config: WebdriverIO.Config & { sessionId?: string },
        private _specs: string[],
        private _reporter: BaseReporter
    ) {
        // listen on testrunner events
        //process.on('message', this.#processMessage.bind(this))
        this._rpc = createClientRpc<ServerFunctions, ClientFunctions>({
            triggerHook: (data) => this.#handleHook(data.id, data),
            consoleMessage: (data) => this.#handleConsole(data),
            runCommand: (data) => this.#handleCommand(data.id, data),
            expectRequest: (data) => this.#handleExpectation(data.id, data),
            browserTestResult: (data) => this.#handleTestFinish(data),
            expectMatchersRequest: (data) => this
                .#expectMatcherResponse(data)
        },
        (msg) => process.send?.(msg),
        (fn) => process.on('message', fn))

        const [, runnerOptions] = Array.isArray(_config.runner) ? _config.runner : []
        this.#runnerOptions = runnerOptions || {}
    }

    /**
     * always return true as it is irrelevant for component testing
     */
    hasTests () {
        return true
    }

    init () {
        return undefined as unknown as TestFramework
    }

    async run () {
        try {
            const failures = await this.#loop()
            return failures
        } catch (_err: unknown) {
            const err = _err as Error
            if ((err as Error).message.includes('net::ERR_CONNECTION_REFUSE')) {
                err.message = `Failed to load test page to run tests, make sure your browser can access "${browser.options.baseUrl}"`
            }

            log.error(`Failed to run browser tests with cid ${this._cid}: ${err.stack}`)
            await this._rpc.errorMessage({
                origin: 'worker',
                name: 'error',
                content: { name: err.name, message: err.message, stack: err.stack }
            })
            return 1
        }
    }

    async #loop () {
        let failures = 0

        /**
         * start tests in a single browser session, hence we use a for...of instead of using Promise concurrency
         */
        for (const spec of this._specs) {
            failures += await this.#runSpec(spec)
        }

        return failures
    }

    async #runSpec (spec: string, retried = false): Promise<number> {
        this.#retryOutdatedOptimizeDep = false
        const timeout = this._config.mochaOpts?.timeout || DEFAULT_TIMEOUT
        log.info(`Run spec file ${spec} for cid ${this._cid}`)

        /**
         * create promise to resolve test state which is being sent through the socket
         * connection from the browser through the main process to the worker
         */
        const testStatePromise = new Promise<TestState>((resolve) => {
            this.#resolveTestStatePromise = resolve
        })

        /**
         * if a `sessionId` is part of `this._config` it means we are in watch mode and are
         * re-using a previous session. Since Vite has already a hot-reload feature, there
         * is no need to call the url command again
         */
        if (!this._config.sessionId) {
            await browser.url(`/?cid=${this._cid}&spec=${(new URL(spec)).pathname}`)
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
        const testTimeout = setTimeout(
            () => this.#onTestTimeout(`Timed out after ${timeout / 1000}s waiting for test results`),
            timeout)

        /**
         * run checks for errors here to avoid breakage in communication with the browser
         */
        const errorInterval = setInterval(
            this.#checkForTestError.bind(this),
            ERROR_CHECK_INTERVAL)

        const state: TestState = await testStatePromise
        clearTimeout(testTimeout)
        clearInterval(errorInterval)

        /**
         * capture coverage if enabled
         */
        if (this.#runnerOptions.coverage?.enabled && process.send) {
            const coverageMap = await browser.execute(
                () => (window.__coverage__ || {})) as unknown as CoverageMapData
            const coverageMessage: WSMessage<WS_MESSAGE_TYPES.coverageMap> = {
                type: WS_MESSAGE_TYPES.coverageMap,
                value: coverageMap
            }
            await this._rpc.workerEvent({
                origin: 'worker',
                name: 'workerEvent',
                args: coverageMessage
            })
        }

        /**
         * let runner fail if we detect an error
         */
        if (state.errors?.length) {
            const errors = state.errors.map((ev) => state.hasViteError
                ? `${ev.message}\n${(ev.error ? ev.error.split('\n').slice(1).join('\n') : '')}`
                : `${path.basename(ev.filename || spec)}: ${ev.message}\n${(ev.error ? ev.error.split('\n').slice(1).join('\n') : '')}`)

            /**
             * retry Vite dynamic import errors once
             */
            if (!retried && errors.some((err) => (
                err.includes('Failed to fetch dynamically imported module') ||
                err.includes('the server responded with a status of 504 (Outdated Optimize Dep)') ||
                /**
                 * this is specific to Preact and can bre resolved by rerunning the spec
                 */
                err.includes('undefined is not an object (evaluating \'r.__H\')')
            ))) {
                log.info('Retry test run due to dynamic import error')
                return this.#runSpec(spec, true)
            }

            const { name, message, stack } = new Error(state.hasViteError
                ? `Test failed due to the following error: ${errors.join('\n\n')}`
                : `Test failed due to following error(s):${sep}${errors.join(sep)}`)
            await this._rpc.errorMessage({
                origin: 'worker',
                name: 'error',
                content: { name, message, stack }
            })
            return 1
        }

        /**
         * report browser events to WebdriverIO reporter
         */
        for (const ev of (state.events || [])) {
            if ((ev.type === 'suite:start' || ev.type === 'suite:end') && ev.title === '') {
                continue
            }
            this._reporter.emit(ev.type, {
                ...ev,
                file: spec,
                uid: `${this._cid}-${Buffer.from(ev.fullTitle).toString('base64')}`,
                cid: this._cid
            })
        }
        return state.failures || 0
    }

 /*   async #processMessage (cmd: Workers.WorkerRequest) {
        if (cmd.command !== 'workerRequest' || !process.send) {
            return
        }

        const { message, id } = cmd.args
        if (isWSMessage(message, WS_MESSAGE_TYPES.hookTriggerMessage)) {
            return this.#handleHook(id, message.value)
        }

        if (isWSMessage(message, WS_MESSAGE_TYPES.consoleMessage)) {
            return this.#handleConsole(message.value)
        }

        if (isWSMessage(message, WS_MESSAGE_TYPES.commandRequestMessage)) {
            return this.#handleCommand(id, message.value)
        }

        if (isWSMessage(message, WS_MESSAGE_TYPES.expectRequestMessage)) {
            return this.#handleExpectation(id, message.value)
        }

        if (isWSMessage(message, WS_MESSAGE_TYPES.browserTestResult)) {
            return this.#handleTestFinish(message.value)
        }

        if (message.type === WS_MESSAGE_TYPES.expectMatchersRequest) {
            return this.#sendWorkerResponse(
                id,
                this.#expectMatcherResponse({ matchers: Array.from(matchers.keys()) })
            )
        }
    }*/

    async #handleHook (
        id: number,
        payload: WSMessageValue[WS_MESSAGE_TYPES.hookTriggerMessage]
    ) {
        const error: Error | undefined = await executeHooksWithArgs(
            payload.name,
            this._config[payload.name as keyof Services.HookFunctions],
            payload.args
        ).then(() => undefined, (err) => err)

        if (error) {
            log.warn(`Failed running "${payload.name}" hook for cid ${payload.cid}: ${error.message}`)
        }

        return this.#sendWorkerResponse(id, this.#hookResponse({ id: payload.id, error }))
    }

    #expectMatcherResponse (value: WSMessageValue[WS_MESSAGE_TYPES.expectMatchersResponse])
        : WSMessage<WS_MESSAGE_TYPES.expectMatchersResponse> {
        return {
            type: WS_MESSAGE_TYPES.expectMatchersResponse,
            value
        }
    }

    #hookResponse (value: WSMessageValue[WS_MESSAGE_TYPES.hookResultMessage])
        : WSMessage<WS_MESSAGE_TYPES.hookResultMessage> {
        return {
            type: WS_MESSAGE_TYPES.hookResultMessage,
            value
        }
    }

    #sendWorkerResponse (id: number, message: AnyWSMessage) {
        if (!process.send) {
            return
        }
        this._rpc.workerResponse({
            origin: 'worker',
            name: 'workerResponse',
            args: { id, message }
        })
    }

    /**
     * Print console message executed in browser to the terminal
     * @param message console.log message args
     * @returns void
     */
    #handleConsole (message: WSMessageValue[WS_MESSAGE_TYPES.consoleMessage]) {
        const isWDIOLog = Boolean(typeof message.args[0] === 'string' && message.args[0].startsWith('[WDIO]') && message.type !== 'error')
        if (message.name !== 'consoleEvent' || isWDIOLog) {
            return
        }
        console[message.type](...(message.args || []))
    }

    async #handleCommand (
        id: number,
        payload: WSMessageValue[WS_MESSAGE_TYPES.commandRequestMessage]
    ) {
        log.debug(`Received browser message: ${JSON.stringify(payload)}`)
        const cid = payload.cid
        if (typeof cid !== 'string') {
            const { message, stack } = new Error(`No "cid" property passed into command message with id "${payload.id}"`)
            const error = { message, stack, name: 'Error' }
            return this.#sendWorkerResponse(id, this.#commandResponse({ id: payload.id, error }))
        }

        try {
            /**
             * user either the browser instance or an element based on whether or not
             * a scope property was passed in
             */
            const scope = payload.scope
                ? await browser.$({ [ELEMENT_KEY]: payload.scope })
                : browser

            /**
             * double check if function is registered
             */
            if (typeof scope[payload.commandName as keyof typeof scope] !== 'function') {
                throw new Error(`${payload.scope ? 'element' : 'browser'}.${payload.commandName} is not a function`)
            }

            let result = await (scope[payload.commandName as keyof typeof scope] as Function)(...payload.args)

            /**
             * if result is an element, transform it into an element reference
             */
            if (result?.constructor?.name === 'Element') {
                result = result.elementId
                    ? { [ELEMENT_KEY]: result.elementId }
                    : result.error
                        ? { message: result.error.message, stack: result.error.stack, name: result.error.name }
                        : undefined
            /**
             * if result is an array of elements, transform it into an array of element references
             */
            } else if (result?.foundWith) {
                /**
                 * need await here since ElementArray functions return a promise
                 */
                result = (await result.map((res: WebdriverIO.Element) => ({
                    [ELEMENT_KEY]: res.elementId
                }))).filter(Boolean)
            }

            const resultMsg = this.#commandResponse({ id: payload.id, result })
            log.debug(`Return command result: ${resultMsg}`)
            return this.#sendWorkerResponse(id, resultMsg)
        } catch (error: unknown) {
            const { message, stack, name } = error as Error
            return this.#sendWorkerResponse(id, this.#commandResponse({ id: payload.id, error: { message, stack, name } }))
        }
    }

    #commandResponse (value: WSMessageValue[WS_MESSAGE_TYPES.commandResponseMessage])
        : WSMessage<WS_MESSAGE_TYPES.commandResponseMessage> {
        return {
            type: WS_MESSAGE_TYPES.commandResponseMessage,
            value
        }
    }

    /**
     * handle expectation assertions within the worker process
     * @param id message id from communicator
     * @param payload information about the expectation to run
     * @returns void
     */
    async #handleExpectation (
        id: number,
        payload: WSMessageValue[WS_MESSAGE_TYPES.expectRequestMessage]
    ) {
        log.debug(`Received expectation message: ${JSON.stringify(payload)}`)
        const cid = payload.cid
        /**
         * check if payload contains `cid` needed to get a browser instance from the pool
         */
        if (typeof cid !== 'string') {
            const message = `No "cid" property passed into expect request message with id "${payload.id}"`
            return this.#sendWorkerResponse(id, this.#expectResponse({ id: payload.id, pass: false, message }))
        }

        /**
         * find matcher, e.g. `toBeDisplayed` or `toHaveTitle`
         */
        const matcher = matchers.get(payload.matcherName)
        if (!matcher) {
            const message = `Couldn't find matcher with name "${payload.matcherName}"`
            return this.#sendWorkerResponse(id, this.#expectResponse({ id: payload.id, pass: false, message }))
        }

        try {
            let context: WebdriverIO.Browser | ChainablePromiseElement | ChainablePromiseElement[] |ChainablePromiseArray

            if (payload.element) {
                if (Array.isArray(payload.element)) {
                    // Element is an array, assume it's a selector list and resolve it with $$.
                    context = await browser.$$(payload.element)
                } else {
                    const elementId = await payload.element.elementId
                    /**
                     * If the element has already been resolved (i.e., it has an elementId),
                     * we can reuse it directly. Otherwise, we attempt to resolve it via its selector.
                     */
                    context = elementId
                        ? await browser.$(payload.element)
                        : await browser.$(await payload.element.selector)
                }
            } else {
                // Fallback to provided context or global browser
                context = payload.context || browser
            }

            const result = await matcher.apply(payload.scope, [context, ...payload.args.map(transformExpectArgs)])

            return this.#sendWorkerResponse(id, this.#expectResponse({
                id: payload.id,
                pass: result.pass,
                message: result.message()
            }))
        } catch (err) {
            const errorMessage = err instanceof Error ? (err as Error).stack : err
            const message = `Failed to execute expect command "${payload.matcherName}": ${errorMessage}`
            return this.#sendWorkerResponse(id, this.#expectResponse({ id: payload.id, pass: false, message }))
        }
    }

    #expectResponse(
        value: WSMessageValue[WS_MESSAGE_TYPES.expectResponseMessage]
    ): WSMessage<WS_MESSAGE_TYPES.expectResponseMessage> {
        return {
            type: WS_MESSAGE_TYPES.expectResponseMessage,
            value
        }
    }

    #handleTestFinish (payload: WSMessageValue[WS_MESSAGE_TYPES.browserTestResult]) {
        this.#resolveTestStatePromise!({
            failures: payload.failures,
            events: payload.events
        })
    }

    #onTestTimeout (message: string) {
        return this.#resolveTestStatePromise?.({
            events: [],
            failures: 1,
            errors: [{ message }]
        })
    }

    async #checkForTestError () {
        const testError = await browser.execute(function fetchExecutionState () {
            let viteError
            const viteErrorElem = document.querySelector('vite-error-overlay')
            if (viteErrorElem && viteErrorElem.shadowRoot) {
                const errorElements = Array.from(viteErrorElem.shadowRoot.querySelectorAll('pre'))
                if (errorElements.length) {
                    viteError = [{ message: errorElements.map((elem) => elem.innerText).join('\n') }]
                }
            }
            const loadError = (
                typeof window.__wdioErrors__ === 'undefined' &&
                document.title !== 'WebdriverIO Browser Test' &&
                !document.querySelector('mocha-framework')
            )
                ?  [{ message: `Failed to load test page (title = "${document.title}", source: ${document.documentElement.innerHTML})` }]
                : null
            const errors = viteError || window.__wdioErrors__ || loadError
            return { errors, hasViteError: Boolean(viteError) }
        }).catch((err: unknown) => {
            /**
             * ignore error, see https://github.com/GoogleChromeLabs/chromium-bidi/issues/1102
             */
            if (err instanceof Error && err.message.includes('Cannot find context with specified id')) {
                return
            }

            throw err
        })

        if (!testError) {
            return
        }

        if ((testError.errors && testError.errors.length > 0) || testError.hasViteError) {
            this.#resolveTestStatePromise?.({
                events: [],
                failures: 1,
                ...testError
            })
        }

        /**
         * check for outdated optimize dep errors that occasionally happen in Vite
         */
        const logs = typeof browser.getLogs === 'function'
            ? (await browser.getLogs('browser').catch(() => []))
            : []
        const severeLogs = logs.filter((log: LogMessage) => log.level === 'SEVERE' && log.source !== 'deprecation') as LogMessage[]
        if (severeLogs.length) {
            if (!this.#retryOutdatedOptimizeDep && severeLogs.some((log) => log.message?.includes('(Outdated Optimize Dep)'))) {
                log.info('Retry test run due to outdated optimize dep')
                this.#retryOutdatedOptimizeDep = true
                return browser.refresh()
            }

            this.#resolveTestStatePromise?.({
                events: [],
                failures: 1,
                hasViteError: false,
                /**
                 * error messages often look like:
                 * "http://localhost:40167/node_modules/.vite/deps/expect.js?v=bca8e2f3 - Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)"
                 */
                errors: severeLogs.map((log) => {
                    const [filename, message] = log.message!.split(' - ')
                    return {
                        filename: filename.startsWith('http') ? filename : undefined,
                        message
                    }
                })
            })
        }
    }

    static init (cid: string, config: WebdriverIO.Config, specs: string[], _: unknown, reporter: BaseReporter) {
        const framework = new BrowserFramework(cid, config, specs, reporter)
        return framework
    }
}
