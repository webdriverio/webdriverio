import speedline from 'speedline'
import logger from 'wdio-logger'

import FirstInteractiveAudit from './lighthouse/firstInteractive'
import TraceOfTab from './lighthouse/tabTraces'
import NetworkHandler from './handler/network'

import { DEFAULT_TRACING_CATEGORIES } from './constants'
import { readIOStream, sumByKey } from './utils'

const log = logger('wdio-devtools-service:CommandHandler')

export default class CommandHandler {
    constructor (client, browser) {
        this.client = client
        this.browser = browser
        this.isTracing = false
        this.networkHandler = new NetworkHandler(client)

        /**
         * register browser commands
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => this.browser.addCommand(fnName, ::this[fnName]))

        /**
         * propagate CDP events to the browser event listener
         */
        this.client.on('event', (event) => {
            const method = event.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(event.params)}`)
            this.browser.emit(method, event.params)
        })
    }

    /**
     * allow to easily access the CDP from the browser object
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
     * helper method to receive Chrome remote debugging connection data to
     * e.g. use external tools like lighthouse
     */
    cdpConnection () {
        const { host, port } = this.client
        return { host, port }
    }

    /**
     * get nodeId to use for other commands
     */
    async getNodeId (selector) {
        const document = await this.cdp('DOM', 'getDocument');
        const { nodeId } = await this.cdp(
            'DOM', 'querySelector',
            { nodeId: document.root.nodeId, selector }
        )
        return nodeId
    }

    /**
     * get nodeIds to use for other commands
     */
    async getNodeIds (selector) {
        const document = await this.cdp('DOM', 'getDocument');
        const { nodeIds } = await this.cdp(
            'DOM', 'querySelectorAll',
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
     * stop tracing the browser
     *
     * @return {Number}  tracing id to use for other commands
     */
    async endTracing () {
        if (!this.isTracing) {
            throw new Error('No tracing was initiated, call `browser.startTracing()` first')
        }

        this.cdp('Tracing', 'end')
        const stream = await new Promise((resolve, reject) => {
            const timeout = setTimeout(
                () => reject('Did not receive a Tracing.tracingComplete event'),
                5000)

            this.browser.once('Tracing.tracingComplete', ({ stream }) => {
                clearTimeout(timeout)
                resolve(stream)
            })
        })

        this.traceEvents = await readIOStream(::this.cdp, stream)
        return stream
    }

    /**
     * get raw trace logs
     */
    getTraceLogs () {
        return this.traceEvents
    }

    /**
     * get speedindex metrics using speedline package
     */
    async getSpeedIndex () {
        const { speedIndex, perceptualSpeedIndex } = await speedline(this.traceEvents)
        return { speedIndex, perceptualSpeedIndex }
    }

    /**
     * get performance metrics
     */
    getPerformanceMetrics () {
        const traces = TraceOfTab.compute(this.traceEvents)
        const audit = new FirstInteractiveAudit()
        let ttfi = null

        /**
         * There are cases where TTFI can't be computed as the tracing window is not long enough.
         * In order to always be able to capture TTFI we would need to wait around 5 seconds after
         * the page has been loaded to have high enough chances there is a quite window in that
         * time frame.
         */
        try {
            ttfi = audit.computeWithArtifacts(traces).timeInMs
        } catch (e) {
            log.warn(`Couldn't compute timeToFirstInteractive due to "${e.friendlyMessage}"`)
        }

        return {
            firstPaint: traces.timings.firstPaint,
            firstContentfulPaint: traces.timings.firstContentfulPaint,
            firstMeaningfulPaint: traces.timings.firstMeaningfulPaint,
            domContentLoaded: traces.timings.domContentLoaded,
            timeToFirstInteractive: ttfi,
            load: traces.timings.load
        }
    }

    /**
     * get page weight from last page load
     */
    getPageWeight () {
        const pageWeight = sumByKey(Object.values(this.networkHandler.requestTypes), 'size')
        const transferred = sumByKey(Object.values(this.networkHandler.requestTypes), 'encoded')
        const requestCount = sumByKey(Object.values(this.networkHandler.requestTypes), 'count')
        return { pageWeight, transferred, requestCount, details: this.networkHandler.requestTypes }
    }
}
