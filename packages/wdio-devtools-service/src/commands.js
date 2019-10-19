import 'core-js/modules/web.url'
import logger from '@wdio/logger'

import NetworkHandler from './handler/network'

import { DEFAULT_TRACING_CATEGORIES } from './constants'
import { readIOStream, sumByKey } from './utils'

const log = logger('@wdio/devtools-service:CommandHandler')

export default class CommandHandler {
    constructor (client, browser) {
        this.client = client
        this.browser = browser
        this.isTracing = false
        this.networkHandler = new NetworkHandler(client)

        /**
         * Register browser commands.
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => this.browser.addCommand(fnName, ::this[fnName]))

        /**
         * Propagate CDP events to the browser event listener.
         */
        this.client.on('event', (event) => {
            const method = event.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(event.params)}`)
            this.browser.emit(method, event.params)
        })
    }

    /**
     * Allow easy access to CDP from the browser object.
     */
    cdp (domain, command, args = {}) {
        if (!this.client[domain]) {
            throw new Error(`Domain "${domain}" doesn't exist in the Chrome DevTools protocol`)
        }

        if (!this.client[domain][command]) {
            throw new Error(`The "${domain}" domain doesn't have a method called "${command}"`)
        }

        log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
        return new Promise((resolve, reject) => this.client[domain][command](args, (err, result) => {
            /* istanbul ignore if */
            if (err) {
                return reject(new Error(`Chrome DevTools Error: ${result.message}`))
            }

            return resolve(result)
        }))
    }

    /**
     * Helper method to receive Chrome remote debugging connection data 
     * (e.g., to use external tools like lighthouse).
     */
    cdpConnection () {
        const { host, port } = this.client
        return { host, port }
    }

    /**
     * get nodeId to use for other commands
     */
    async getNodeId (selector) {
        const document = await this.cdp('DOM', 'getDocument')
        const { nodeId } = await this.cdp(
            'DOM', 'querySelector',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeId
    }

    /**
     * Get nodeIds to use for other commands.
     */
    async getNodeIds (selector) {
        const document = await this.cdp('DOM', 'getDocument')
        const { nodeIds } = await this.cdp(
            'DOM', 'querySelectorAll',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeIds
    }

    /**
     * Start tracing the browser.
     *
     * @param  {string[]} [categories=DEFAULT_TRACING_CATEGORIES]  - Categories to trace for
     * @param  {Number}   [samplingFrequency=10000]                - Sampling frequency
     */
    startTracing (categories = DEFAULT_TRACING_CATEGORIES, samplingFrequency = 10000) {
        if (this.isTracing) {
            throw new Error('browser is already being traced')
        }

        this.isTracing = true
        return this.cdp('Tracing', 'start', {
            categories: categories.join(','),
            transferMode: 'ReturnAsStream',
            options: `sampling-frequency=${samplingFrequency}` // 1000 is default and too slow.
        })
    }

    /**
     * Stop tracing the browser.
     *
     * @return {Number}  - Tracing id to use for other commands
     */
    async endTracing () {
        if (!this.isTracing) {
            throw new Error('No tracing was initiated, call `browser.startTracing()` first')
        }

        this.cdp('Tracing', 'end')
        const stream = await new Promise((resolve, reject) => {
            const timeout = setTimeout(
                /* istanbul ignore next */
                () => reject('Did not receive a Tracing.tracingComplete event'),
                5000)

            this.browser.once('Tracing.tracingComplete', ({ stream }) => {
                clearTimeout(timeout)
                resolve(stream)
                this.isTracing = false
            })
        })

        this.traceEvents = await readIOStream(::this.cdp, stream)
        return stream
    }

    /**
     * Get raw trace logs.
     */
    getTraceLogs () {
        return this.traceEvents
    }

    /**
     * Get page weight from last page load.
     */
    getPageWeight () {
        const pageWeight = sumByKey(Object.values(this.networkHandler.requestTypes), 'size')
        const transferred = sumByKey(Object.values(this.networkHandler.requestTypes), 'encoded')
        const requestCount = sumByKey(Object.values(this.networkHandler.requestTypes), 'count')
        return { pageWeight, transferred, requestCount, details: this.networkHandler.requestTypes }
    }
}
