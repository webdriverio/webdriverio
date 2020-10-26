import 'core-js/modules/web.url'
import logger from '@wdio/logger'

import NetworkHandler from './handler/network'

import { DEFAULT_TRACING_CATEGORIES } from './constants'
import { sumByKey } from './utils'

const log = logger('@wdio/devtools-service:CommandHandler')

export default class CommandHandler {
    constructor (session, page) {
        this.session = session
        this.page = page
        this.isTracing = false
        this.networkHandler = new NetworkHandler(session)

        /**
         * register browser commands
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => global.browser.addCommand(fnName, this[fnName].bind(this)))
    }

    /**
     * allow to easily access the CDP from the browser object
     */
    cdp (domain, command, args = {}) {
        log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
        return this.session.send(`${domain}.${command}`, args)
    }

    /**
     * get nodeId to use for other commands
     */
    async getNodeId (selector) {
        const document = await this.session.send('DOM.getDocument')
        const { nodeId } = await this.session.send(
            'DOM.querySelector',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeId
    }

    /**
     * get nodeIds to use for other commands
     */
    async getNodeIds (selector) {
        const document = await this.session.send('DOM.getDocument')
        const { nodeIds } = await this.session.send(
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
    } = {}) {
        if (this.isTracing) {
            throw new Error('browser is already being traced')
        }

        this.isTracing = true
        this.traceEvents = undefined
        return this.page.tracing.start({ categories, path, screenshots })
    }

    /**
     * stop tracing the browser
     *
     * @return {Number}  tracing id to use for other commands
     */
    async endTracing() {
        if (!this.isTracing) {
            throw new Error('No tracing was initiated, call `browser.startTracing()` first')
        }

        try {
            this.traceEvents = await this.page.tracing.stop()
            this.traceEvents = JSON.parse(this.traceEvents.toString('utf8'))
            this.isTracing = false
        } catch (err) {
            throw new Error(`Couldn't parse trace events: ${err.message}`)
        }

        return this.traceEvents
    }

    /**
     * get raw trace logs
     */
    getTraceLogs() {
        return this.traceEvents
    }

    /**
     * get page weight from last page load
     */
    getPageWeight() {
        const pageWeight = sumByKey(Object.values(this.networkHandler.requestTypes), 'size')
        const transferred = sumByKey(Object.values(this.networkHandler.requestTypes), 'encoded')
        const requestCount = sumByKey(Object.values(this.networkHandler.requestTypes), 'count')
        return { pageWeight, transferred, requestCount, details: this.networkHandler.requestTypes }
    }
}
