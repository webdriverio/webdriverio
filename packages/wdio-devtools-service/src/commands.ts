import 'core-js/modules/web.url'
import logger from '@wdio/logger'

import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { TraceEvent } from '@tracerbench/trace-event'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { TracingOptions } from 'puppeteer-core/lib/cjs/puppeteer/common/Tracing'

import NetworkHandler, { RequestPayload } from './handler/network'

import { DEFAULT_TRACING_CATEGORIES } from './constants'
import { sumByKey } from './utils'

const log = logger('@wdio/devtools-service:CommandHandler')

export default class CommandHandler {
    private _isTracing = false
    private _networkHandler: NetworkHandler
    private _traceEvents?: TraceEvent[]

    constructor (
        private _session: CDPSession,
        private _page: Page,
        browser: Browser | MultiRemoteBrowser
    ) {
        this._session = _session
        this._page = _page
        this._networkHandler = new NetworkHandler(_session)

        /**
         * register browser commands
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => browser.addCommand(
            fnName,
            this[fnName as keyof CommandHandler].bind(this)
        ))
    }

    /**
     * allow to easily access the CDP from the browser object
     */
    cdp (domain: string, command: string, args = {}) {
        log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
        return this._session.send(`${domain}.${command}` as any, args)
    }

    /**
     * get nodeId to use for other commands
     */
    async getNodeId (selector: string) {
        const document = await this._session.send('DOM.getDocument')
        const { nodeId } = await this._session.send(
            'DOM.querySelector',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeId
    }

    /**
     * get nodeIds to use for other commands
     */
    async getNodeIds (selector: string) {
        const document = await this._session.send('DOM.getDocument')
        const { nodeIds } = await this._session.send(
            'DOM.querySelectorAll',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeIds
    }

    /**
     * start tracing the browser
     *
     * @param  {string[]} [categories=DEFAULT_TRACING_CATEGORIES]  categories to trace for
     * @param  {Number}   [samplingFrequency=10000]                sampling frequency
     */
    startTracing ({
        categories = DEFAULT_TRACING_CATEGORIES,
        path,
        screenshots = true
    }: TracingOptions = {}) {
        if (this._isTracing) {
            throw new Error('browser is already being traced')
        }

        this._isTracing = true
        this._traceEvents = undefined
        return this._page.tracing.start({ categories, path, screenshots })
    }

    /**
     * stop tracing the browser
     *
     * @return {Number}  tracing id to use for other commands
     */
    async endTracing () {
        if (!this._isTracing) {
            throw new Error('No tracing was initiated, call `browser.startTracing()` first')
        }

        try {
            const traceBuffer = await this._page.tracing.stop()
            this._traceEvents = JSON.parse(traceBuffer.toString('utf8'))
            this._isTracing = false
        } catch (err) {
            throw new Error(`Couldn't parse trace events: ${err.message}`)
        }

        return this._traceEvents
    }

    /**
     * get raw trace logs
     */
    getTraceLogs () {
        return this._traceEvents
    }

    /**
     * get page weight from last page load
     */
    getPageWeight () {
        const requestTypes = Object.values(this._networkHandler.requestTypes).filter(Boolean) as RequestPayload[]
        const pageWeight = sumByKey(requestTypes, 'size')
        const transferred = sumByKey(requestTypes, 'encoded')
        const requestCount = sumByKey(requestTypes, 'count')
        return { pageWeight, transferred, requestCount, details: this._networkHandler.requestTypes }
    }
}
