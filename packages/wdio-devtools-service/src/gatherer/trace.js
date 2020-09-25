import 'core-js/modules/web.url'

import EventEmitter from 'events'
import NetworkRecorder from 'lighthouse/lighthouse-core/lib/network-recorder'
import logger from '@wdio/logger'

import registerPerformanceObserverInPage from '../scripts/registerPerformanceObserverInPage'
import checkTimeSinceLastLongTask from '../scripts/checkTimeSinceLastLongTask'

import {
    DEFAULT_TRACING_CATEGORIES, FRAME_LOAD_START_TIMEOUT, TRACING_TIMEOUT,
    MAX_TRACE_WAIT_TIME, CPU_IDLE_TRESHOLD, NETWORK_IDLE_TIMEOUT, CLICK_TRANSITION
} from '../constants'
import { isSupportedUrl } from '../utils'

const log = logger('@wdio/devtools-service:TraceGatherer')

const NETWORK_RECORDER_EVENTS = [
    'Network.requestWillBeSent',
    'Network.requestServedFromCache',
    'Network.responseReceived',
    'Network.dataReceived',
    'Network.loadingFinished',
    'Network.loadingFailed',
    'Network.resourceChangedPriority'
]

export default class TraceGatherer extends EventEmitter {
    constructor (session, page) {
        super()
        this.session = session
        this.page = page
        this.networkListeners = {}
        this.failingFrameLoadIds = []
        this.pageLoadDetected = false

        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this.networkListeners[method] = (params) => this.networkStatusMonitor.dispatch({ method, params })
        })
    }

    async startTracing (url) {
        /**
         * delete old trace
         */
        delete this.trace

        /**
         * register listener for network status monitoring
         */
        this.networkStatusMonitor = new NetworkRecorder()
        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this.session.on(method, this.networkListeners[method])
        })

        this.traceStart = Date.now()
        log.info(`Start tracing frame with url ${url}`)
        await this.page.tracing.start({
            categories: DEFAULT_TRACING_CATEGORIES,
            screenshots: true
        })

        /**
         * if this tracing was started from a click transition
         * then we want to discard page trace if no load detected
         */
        if (url === CLICK_TRANSITION) {
            log.info('Start checking for page load for click')
            this.clickTraceTimeout = setTimeout(async () => {
                log.info('No page load detected, canceling trace')
                await this.page.tracing.stop()
                return this.finishTracing()
            }, FRAME_LOAD_START_TIMEOUT)
        }

        /**
         * register performance observer
         */
        await this.page.evaluateOnNewDocument(registerPerformanceObserverInPage)

        this.waitForNetworkIdleEvent = this.waitForNetworkIdle(this.session)
        this.waitForCPUIdleEvent = this.waitForCPUIdle()
    }

    /**
     * store frame id of frames that are being traced
     */
    async onFrameNavigated (msgObj) {
        if (!this.isTracing) {
            return
        }
        /**
         * page load failed, cancel tracing
         */
        if (this.failingFrameLoadIds.includes(msgObj.frame.id)) {
            delete this.traceStart
            this.waitForNetworkIdleEvent.cancel()
            this.waitForCPUIdleEvent.cancel()
            this.frameId = '"unsuccessful loaded frame"'
            this.finishTracing()
            this.emit('tracingError', new Error(`Page with url "${msgObj.frame.url}" failed to load`))
            return clearTimeout(this.clickTraceTimeout)
        }

        /**
         * ignore event if
         */
        if (
            // we already detected a frameId before
            this.frameId ||
            // the event was thrown for a sub frame (e.g. iframe)
            msgObj.frame.parentId ||
            // we don't support the url of given frame
            !isSupportedUrl(msgObj.frame.url)
        ) {
            log.info(`Ignore navigated frame with url ${msgObj.frame.url}`)
            return
        }

        this.frameId = msgObj.frame.id
        this.loaderId = msgObj.frame.loaderId
        this.pageUrl = msgObj.frame.url
        log.info(`Page load detected: ${this.pageUrl}, set frameId ${this.frameId}, set loaderId ${this.loaderId}`)

        /**
         * clear click tracing timeout if it's still waiting
         *
         * the reason we have to tie this to Page.frameNavigated instead of Page.frameStartedLoading
         * is because the latter can sometimes occur without the former, which will cause a hang
         * e.g. with duolingo's sign-in button
         */
        if (this.clickTraceTimeout && !this.pageLoadDetected) {
            log.info('Page load detected for click, clearing click trace timeout}')
            this.pageLoadDetected = true
            clearTimeout(this.clickTraceTimeout)
        }

        this.emit('tracingStarted', msgObj.frame.id)
    }

    /**
     * once the page load event has fired, we can grab some performance
     * metrics and timing
     */
    async onLoadEventFired () {
        if (!this.isTracing) {
            return
        }

        /**
         * Ensure that page is fully loaded and all metrics can be calculated.
         *
         * This can only be ensured if the following conditions are met:
         *  - Listener for onload. Resolves on first FCP event.
         *  - Listener for onload. Resolves pauseAfterLoadMs ms after load.
         *  - Network listener. Resolves when the network has been idle for networkQuietThresholdMs.
         *  - CPU listener. Resolves when the CPU has been idle for cpuQuietThresholdMs after network idle.
         *
         * See https://github.com/GoogleChrome/lighthouse/issues/627 for more.
         */
        const loadPromise = Promise.all([
            this.waitForNetworkIdleEvent.promise,
            this.waitForCPUIdleEvent.promise
        ]).then(() => async () => {
            /**
             * ensure that we trace at least for 5s to ensure that we can
             * calculate firstInteractive
             */
            const minTraceTime = TRACING_TIMEOUT - (Date.now() - this.traceStart)
            if (minTraceTime > 0) {
                log.info(`page load happen to quick, waiting ${minTraceTime}ms more`)
                await new Promise((resolve) => setTimeout(resolve, minTraceTime))
            }

            return this.completeTracing()
        })

        const cleanupFn = await Promise.race([
            loadPromise,
            this.waitForMaxTimeout()
        ])

        this.waitForNetworkIdleEvent.cancel()
        this.waitForCPUIdleEvent.cancel()
        return cleanupFn()
    }

    onFrameLoadFail (request) {
        const frame = request.frame()
        this.failingFrameLoadIds.push(frame._id)
    }

    get isTracing () {
        return typeof this.traceStart === 'number'
    }

    /**
     * once tracing has finished capture trace logs into memory
     */
    async completeTracing () {
        const traceDuration = Date.now() - this.traceStart
        log.info(`Tracing completed after ${traceDuration}ms, capturing performance data for frame ${this.frameId}`)

        /**
         * download all tracing data
         * in case it fails, continue without capturing any data
         */
        try {
            const traceBuffer = await this.page.tracing.stop()
            const traceEvents = JSON.parse(traceBuffer.toString('utf8'))

            /**
             * modify pid of renderer frame to be the same as where tracing was started
             * possibly related to https://github.com/GoogleChrome/lighthouse/issues/6968
             */
            const startedInBrowserEvt = traceEvents.traceEvents.find(e => e.name === 'TracingStartedInBrowser')
            const mainFrame = (
                startedInBrowserEvt &&
                startedInBrowserEvt.args &&
                startedInBrowserEvt.args.data.frames &&
                startedInBrowserEvt.args.data.frames.find(frame => !frame.parent)
            )
            if (mainFrame && mainFrame.processId) {
                const threadNameEvt = traceEvents.traceEvents.find(e => e.ph === 'R' &&
                    e.cat === 'blink.user_timing' && e.name === 'navigationStart' && e.args.data.isLoadingMainFrame)
                if (threadNameEvt) {
                    log.info(`Replace mainFrame process id ${mainFrame.processId} with actual thread process id ${threadNameEvt.pid}`)
                    mainFrame.processId = threadNameEvt.pid
                } else {
                    log.info(`Couldn't replace mainFrame process id ${mainFrame.processId} with actual thread process id`)
                }
            }

            this.trace = {
                ...traceEvents,
                frameId: this.frameId,
                loaderId: this.loaderId,
                pageUrl: this.pageUrl,
                traceStart: this.traceStart,
                traceEnd: Date.now()
            }
            this.emit('tracingComplete', this.trace)
            this.finishTracing()
        } catch (err) {
            log.error(`Error capturing tracing logs: ${err.stack}`)
            this.emit('tracingError', err)
            return this.finishTracing()
        }
    }

    /**
     * clear tracing states and emit tracingFinished
     */
    finishTracing () {
        log.info(`Tracing for ${this.frameId} completed`)
        this.pageLoadDetected = false

        /**
         * clean up the listeners
         */
        NETWORK_RECORDER_EVENTS.forEach(
            (method) => this.session.removeListener(method, this.networkListeners[method]))
        delete this.networkStatusMonitor

        delete this.traceStart
        delete this.frameId
        delete this.loaderId
        delete this.pageUrl
        this.failingFrameLoadIds = []
        this.waitForNetworkIdleEvent.cancel()
        this.waitForCPUIdleEvent.cancel()
        this.emit('tracingFinished')
    }

    /**
     * Returns a promise that resolves when the network has been idle (after DCL) for
     * `networkQuietThresholdMs` ms and a method to cancel internal network listeners/timeout.
     * (code from lighthouse source)
     * @param {number} networkQuietThresholdMs
     * @return {{promise: Promise<void>, cancel: function(): void}}
     * @private
     */
    /* istanbul ignore next */
    waitForNetworkIdle (session, networkQuietThresholdMs = NETWORK_IDLE_TIMEOUT) {
        let hasDCLFired = false
        let idleTimeout
        let cancel = () => {
            throw new Error('_waitForNetworkIdle.cancel() called before it was defined')
        }

        // Check here for networkStatusMonitor to satisfy type checker. Any further race condition
        // will be caught at runtime on calls to it.
        if (!this.networkStatusMonitor) {
            throw new Error('TraceGatherer.waitForNetworkIdle called with no networkStatusMonitor')
        }
        const networkStatusMonitor = this.networkStatusMonitor

        const promise = new Promise((resolve) => {
            const onIdle = () => {
                // eslint-disable-next-line no-use-before-define
                networkStatusMonitor.once('network-2-busy', onBusy)
                idleTimeout = setTimeout(() => {
                    log.info('Network became finally idle')
                    cancel()
                    resolve()
                }, networkQuietThresholdMs)
            }

            const onBusy = () => {
                networkStatusMonitor.once('network-2-idle', onIdle)
                idleTimeout && clearTimeout(idleTimeout)
            }

            const domContentLoadedListener = () => {
                hasDCLFired = true
                networkStatusMonitor.is2Idle()
                    ? onIdle()
                    : onBusy()
            }

            // We frequently need to debug why LH is still waiting for the page.
            // This listener is added to all network events to verbosely log what URLs we're waiting on.
            const logStatus = () => {
                if (!hasDCLFired) {
                    return log.info('Waiting on DomContentLoaded')
                }

                const inflightRecords = networkStatusMonitor.getInflightRecords()
                log.info(`Found ${inflightRecords.length} inflight network records`)
                // If there are more than 20 inflight requests, load is still in full swing.
                // Wait until it calms down a bit to be a little less spammy.
                if (inflightRecords.length < 10) {
                    for (const record of inflightRecords) {
                        log.info(`Waiting on ${record.url.slice(0, 120)} to finish`)
                    }
                }
            }

            networkStatusMonitor.on('requeststarted', logStatus)
            networkStatusMonitor.on('requestloaded', logStatus)
            networkStatusMonitor.on('network-2-busy', logStatus)

            session.once('Page.domContentEventFired', domContentLoadedListener)

            let canceled = false
            cancel = () => {
                if (canceled) return
                canceled = true
                log.info('Wait for network idle canceled')
                idleTimeout && clearTimeout(idleTimeout)

                session.removeListener('Page.domContentEventFired', domContentLoadedListener)

                networkStatusMonitor.removeListener('network-2-busy', onBusy)
                networkStatusMonitor.removeListener('network-2-idle', onIdle)
                networkStatusMonitor.removeListener('requeststarted', logStatus)
                networkStatusMonitor.removeListener('requestloaded', logStatus)
                networkStatusMonitor.removeListener('network-2-busy', logStatus)
            }
        })

        return { promise, cancel }
    }

    /**
     * Resolves when there have been no long tasks for at least waitForCPUIdle ms.
     * (code from lighthouse source)
     * @param {number} waitForCPUIdle
     * @return {{promise: Promise<void>, cancel: function(): void}}
     */
    /* istanbul ignore next */
    waitForCPUIdle (waitForCPUIdle = CPU_IDLE_TRESHOLD) {
        if (!waitForCPUIdle) {
            return {
                promise: Promise.resolve(),
                cancel: () => undefined
            }
        }

        /** @type {NodeJS.Timer|undefined} */
        let lastTimeout
        let canceled = false

        const checkForQuietExpression = `(${checkTimeSinceLastLongTask.toString()})()`
        async function checkForQuiet (resolve, reject) {
            if (canceled) return
            let timeSinceLongTask
            try {
                timeSinceLongTask = (await this.page.evaluate(checkForQuietExpression)) || 0
            } catch (e) {
                log.warn(`Page evaluate rejected while evaluating checkForQuietExpression: ${e.stack}`)
                return setTimeout(() => checkForQuiet.call(this, resolve, reject), 100)
            }

            if (canceled) return

            if (typeof timeSinceLongTask !== 'number') {
                log.warn(`unexpected value for timeSinceLongTask: ${timeSinceLongTask}`)
                return reject(new Error('timeSinceLongTask is not a number'))
            }

            log.info('Driver', `CPU has been idle for ${timeSinceLongTask} ms`)

            if (timeSinceLongTask >= waitForCPUIdle) {
                return resolve()
            }

            const timeToWait = waitForCPUIdle - timeSinceLongTask
            lastTimeout = setTimeout(() => checkForQuiet.call(this, resolve, reject), timeToWait)
        }

        let cancel = () => {
            throw new Error('_waitForCPUIdle.cancel() called before it was defined')
        }
        const promise = new Promise((resolve, reject) => {
            log.info('Waiting for CPU to become idle')
            checkForQuiet.call(this, resolve, reject)
            cancel = () => {
                if (canceled) return
                canceled = true
                if (lastTimeout) clearTimeout(lastTimeout)
                resolve(new Error('Wait for CPU idle canceled'))
            }
        })

        return { promise, cancel }
    }

    waitForMaxTimeout (maxWaitForLoadedMs = MAX_TRACE_WAIT_TIME) {
        return new Promise(
            (resolve) => setTimeout(resolve, maxWaitForLoadedMs)
        ).then(() => async () => {
            log.error('Neither network nor CPU idle time could be detected within timeout, wrapping up tracing')
            return this.completeTracing()
        })
    }
}
