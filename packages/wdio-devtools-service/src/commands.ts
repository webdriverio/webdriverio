import logger from '@wdio/logger'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import type { TraceEvent } from '@tracerbench/trace-event'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page.js'
import type { TracingOptions } from 'puppeteer-core/lib/cjs/puppeteer/common/Tracing.js'

import NetworkHandler, { RequestPayload } from './handler/network.js'

import { DEFAULT_TRACING_CATEGORIES } from './constants.js'
import { sumByKey } from './utils.js'

const log = logger('@wdio/devtools-service:CommandHandler')

export default class CommandHandler {
    private _isTracing = false
    private _networkHandler: NetworkHandler
    private _traceEvents?: TraceEvent[]

    constructor (
        private _session: CDPSession,
        private _page: Page,
        browser: Browser<'async'> | MultiRemoteBrowser<'async'>
    ) {
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
     * The cdp command is a custom command added to the browser scope that allows you
     * to call directly commands to the protocol.
     */
    cdp (domain: string, command: string, args = {}) {
        log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
        return this._session.send(`${domain}.${command}` as any, args)
    }

    /**
     * Helper method to get the nodeId of an element in the page.
     * NodeIds are similar like WebDriver node ids an identifier for a node.
     * It can be used as a parameter for other Chrome DevTools methods, e.g. DOM.focus.
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
     * Helper method to get the nodeId of an element in the page.
     * NodeIds are similar like WebDriver node ids an identifier for a node.
     * It can be used as a parameter for other Chrome DevTools methods, e.g. DOM.focus.
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
     * Start tracing the browser. You can optionally pass in custom tracing categories and the
     * sampling frequency.
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
     * Stop tracing the browser.
     */
    async endTracing () {
        if (!this._isTracing) {
            throw new Error('No tracing was initiated, call `browser.startTracing()` first')
        }

        try {
            const traceBuffer = await this._page.tracing.stop()
            this._traceEvents = JSON.parse(traceBuffer.toString('utf8'))
            this._isTracing = false
        } catch (err: any) {
            throw new Error(`Couldn't parse trace events: ${err.message}`)
        }

        return this._traceEvents
    }

    /**
     * Returns the tracelogs that was captured within the tracing period.
     * You can use this command to store the trace logs on the file system to analyse the trace
     * via Chrome DevTools interface.
     */
    getTraceLogs () {
        return this._traceEvents
    }

    /**
     * Returns page weight information of the last page load.
     */
    getPageWeight () {
        const requestTypes = Object.values(this._networkHandler.requestTypes).filter(Boolean) as RequestPayload[]
        const pageWeight = sumByKey(requestTypes, 'size')
        const transferred = sumByKey(requestTypes, 'encoded')
        const requestCount = sumByKey(requestTypes, 'count')
        return { pageWeight, transferred, requestCount, details: this._networkHandler.requestTypes }
    }
}
