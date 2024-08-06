import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import { browser } from '@wdio/globals'
import { executeHooksWithArgs } from '@wdio/utils'
import { matchers } from 'expect-webdriverio'
import { type Capabilities, type Workers, type Options, type Services, MESSAGE_TYPES } from '@wdio/types'

import { transformExpectArgs } from './utils.js'
import type BaseReporter from './reporter.js'
import type { TestFramework, WorkerResponseMessage } from './types.js'

const log = logger('@wdio/runner')
const sep = '\n  - '
const ERROR_CHECK_INTERVAL = 500
const DEFAULT_TIMEOUT = 60 * 1000

type WDIOErrorEvent = Partial<Pick<ErrorEvent, 'filename' | 'message' | 'error'>> & { hasViteError?: boolean }
interface TestState {
    failures: number
    events: any[]
    errors?: WDIOErrorEvent[]
    hasViteError?: boolean
}

interface LogMessage {
    level: string
    message: string
    source: string
    timestamp: number
}

declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
        __wdioEvents__: any[]
        __wdioFailures__: number
        __coverage__?: unknown
    }
}

export default class BrowserFramework implements Omit<TestFramework, 'init'> {
    #retryOutdatedOptimizeDep = false
    #runnerOptions: any // `any` here because we don't want to create a dependency to @wdio/browser-runner
    #resolveTestStatePromise?: (value: TestState) => void

    constructor (
        private _cid: string,
        private _config: Options.Testrunner & { sessionId?: string },
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: BaseReporter
    ) {
        // listen on testrunner events
        process.on('message', this.#processMessage.bind(this))

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
                () => (window.__coverage__ || {}))
            const workerEvent: Workers.WorkerEvent = {
                origin: 'worker',
                name: 'workerEvent',
                args: {
                    type: MESSAGE_TYPES.coverageMap,
                    value: coverageMap
                }
            }
            process.send(workerEvent)
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
                err.includes('the server responded with a status of 504 (Outdated Optimize Dep)')
            ))) {
                log.info('Retry test run due to dynamic import error')
                return this.#runSpec(spec, true)
            }

            const { name, message, stack } = new Error(state.hasViteError
                ? `Test failed due to the following error: ${errors.join('\n\n')}`
                : `Test failed due to following error(s):${sep}${errors.join(sep)}`)
            process.send!({
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

    async #processMessage (cmd: Workers.WorkerRequest) {
        if (cmd.command !== 'workerRequest' || !process.send) {
            return
        }

        const { message, id } = cmd.args
        if (message.type === MESSAGE_TYPES.hookTriggerMessage) {
            return this.#handleHook(id, message.value)
        }

        if (message.type === MESSAGE_TYPES.consoleMessage) {
            return this.#handleConsole(message.value)
        }

        if (message.type === MESSAGE_TYPES.commandRequestMessage) {
            return this.#handleCommand(id, message.value)
        }

        if (message.type === MESSAGE_TYPES.expectRequestMessage) {
            return this.#handleExpectation(id, message.value)
        }

        if (message.type === MESSAGE_TYPES.browserTestResult) {
            return this.#handleTestFinish(message.value)
        }

        if (message.type === MESSAGE_TYPES.expectMatchersRequest) {
            return this.#sendWorkerResponse(
                id,
                this.#expectMatcherResponse({ matchers: Array.from(matchers.keys()) })
            )
        }
    }

    async #handleHook (id: number, payload: Workers.HookTriggerEvent) {
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

    #expectMatcherResponse (value: Workers.ExpectMatchersResponse): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.expectMatchersResponse,
            value
        }
    }

    #hookResponse (value: Workers.HookResultEvent): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.hookResultMessage,
            value
        }
    }

    #sendWorkerResponse (id: number, message: Workers.SocketMessage) {
        if (!process.send) {
            return
        }

        const response: WorkerResponseMessage = {
            origin: 'worker',
            name: 'workerResponse',
            args: { id, message }
        }
        process.send(response)
    }

    /**
     * Print console message executed in browser to the terminal
     * @param message console.log message args
     * @returns void
     */
    #handleConsole (message: Workers.ConsoleEvent) {
        const isWDIOLog = Boolean(typeof message.args[0] === 'string' && message.args[0].startsWith('[WDIO]') && message.type !== 'error')
        if (message.name !== 'consoleEvent' || isWDIOLog) {
            return
        }
        console[message.type](...(message.args || []))
    }

    async #handleCommand (id: number, payload: Workers.CommandRequestEvent) {
        log.debug(`Received browser message: ${JSON.stringify(payload)}`)
        const cid = payload.cid
        if (typeof cid !== 'string') {
            const { message, stack } = new Error(`No "cid" property passed into command message with id "${payload.id}"`)
            const error = { message, stack, name: 'Error' }
            return this.#sendWorkerResponse(id, this.#commandResponse({ id: payload.id, error }))
        }

        try {
            /**
             * double check if function is registered
             */
            if (typeof browser[payload.commandName as keyof typeof browser] !== 'function') {
                throw new Error(`browser.${payload.commandName} is not a function`)
            }

            const result = await (browser[payload.commandName as keyof typeof browser] as Function)(...payload.args)
            const resultMsg = this.#commandResponse({ id: payload.id, result })

            log.debug(`Return command result: ${resultMsg}`)
            return this.#sendWorkerResponse(id, resultMsg)
        } catch (error: any) {
            const { message, stack, name } = error
            return this.#sendWorkerResponse(id, this.#commandResponse({ id: payload.id, error: { message, stack, name } }))
        }
    }

    #commandResponse (value: Workers.CommandResponseEvent): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.commandResponseMessage,
            value
        }
    }

    /**
     * handle expectation assertions within the worker process
     * @param id message id from communicator
     * @param payload information about the expectation to run
     * @returns void
     */
    async #handleExpectation (id: number, payload: Workers.ExpectRequestEvent) {
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
            const context = payload.element
                ? Array.isArray(payload.element)
                    ? await browser.$$(payload.element)
                    /**
                     * check if element contains an `elementId` property, if so the element was already
                     * found, so we can transform it into an `WebdriverIO.Element` object, if not we
                     * need to find it first, so we pass in the selector.
                     */
                    : payload.element.elementId
                        ? await browser.$(payload.element)
                        : await browser.$(payload.element.selector)
                : payload.context || browser
            const result = await matcher.apply(payload.scope, [context, ...payload.args.map(transformExpectArgs)])
            return this.#sendWorkerResponse(id, this.#expectResponse({
                id: payload.id,
                pass: result.pass,
                message: result.message()
            }))
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? (err as Error).stack : err
            const message = `Failed to execute expect command "${payload.matcherName}": ${errorMessage}`
            return this.#sendWorkerResponse(id, this.#expectResponse({ id: payload.id, pass: false, message }))
        }
    }

    #expectResponse (value: Workers.ExpectResponseEvent): Workers.SocketMessage {
        return {
            type: MESSAGE_TYPES.expectResponseMessage,
            value
        }
    }

    #handleTestFinish (payload: Workers.BrowserTestResults) {
        this.#resolveTestStatePromise!({ failures: payload.failures, events: payload.events })
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
        })

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
        const severeLogs = logs.filter((log: LogMessage) => log.level === 'SEVERE') as LogMessage[]
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

    static init (cid: string, config: any, specs: string[], caps: Capabilities.RemoteCapability, reporter: BaseReporter) {
        const framework = new BrowserFramework(cid, config, specs, caps, reporter)
        return framework
    }
}
