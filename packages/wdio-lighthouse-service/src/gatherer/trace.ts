import { EventEmitter } from 'node:events'
import NetworkRecorder from 'lighthouse/lighthouse-core/lib/network-recorder.js'
import NetworkMonitor from 'lighthouse/lighthouse-core/gather/driver/network-monitor.js'
import ProtocolSession from 'lighthouse/lighthouse-core/fraggle-rock/gather/session.js'
import { waitForFullyLoaded } from 'lighthouse/lighthouse-core/gather/driver/wait-for-condition.js'
import logger from '@wdio/logger'

import type { Protocol } from 'devtools-protocol'
import type { TraceEvent, TraceEventArgs } from '@tracerbench/trace-event'
import type { HTTPRequest } from 'puppeteer-core/lib/esm/puppeteer/common/HTTPRequest.js'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import registerPerformanceObserverInPage from '../scripts/registerPerformanceObserverInPage.js'

import {
    FRAME_LOAD_START_TIMEOUT, TRACING_TIMEOUT, MAX_TRACE_WAIT_TIME,
    CLICK_TRANSITION, NETWORK_RECORDER_EVENTS
} from '../constants.js'
import { isSupportedUrl } from '../utils.js'
import type { GathererDriver } from '../types.js'

const log = logger('@wdio/lighthouse-service:TraceGatherer')

export interface Trace {
    traceEvents: TraceEvent[]
    frameId?: string
    loaderId?: string
    pageUrl?: string
    traceStart?: number
    traceEnd?: number
}

interface StartedInBrowserEvent extends TraceEventArgs {
    data: {
        frames: {
            parent: any
            processId: number
        }[]
    }
}

interface NavigationStartEvent extends TraceEventArgs {
    data: {
        isLoadingMainFrame: boolean
    }
}

export interface WaitPromise {
    promise: Promise<any>
    cancel: Function
}

export default class TraceGatherer extends EventEmitter {
    private _failingFrameLoadIds: string[] = []
    private _pageLoadDetected = false
    private _networkListeners: Record<string, (params: any) => void> = {}

    private _frameId?: string
    private _loaderId?: string
    private _pageUrl?: string
    private _networkStatusMonitor: typeof NetworkRecorder
    private _networkMonitor: typeof NetworkMonitor
    private _protocolSession: typeof  ProtocolSession
    private _trace?: Trace
    private _traceStart?: number
    private _clickTraceTimeout?: NodeJS.Timeout
    private _waitConditionPromises: Promise<void>[] = []

    constructor (private _session: CDPSession, private _page: Page, private _driver: GathererDriver) {
        super()

        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this._networkListeners[method] = (params) => this._networkStatusMonitor.dispatch({ method, params })
        })

        this._protocolSession = new ProtocolSession(_session)
        this._networkMonitor = new NetworkMonitor(_session)
    }

    async startTracing (url: string) {
        /**
         * delete old trace
         */
        delete this._trace

        /**
         * register listener for network status monitoring
         */
        this._networkStatusMonitor = new NetworkRecorder()
        NETWORK_RECORDER_EVENTS.forEach((method) => {
            this._session.on(method, this._networkListeners[method])
        })

        this._traceStart = Date.now()
        log.info(`Start tracing frame with url ${url}`)
        await this._driver.beginTrace()

        /**
         * if this tracing was started from a click transition
         * then we want to discard page trace if no load detected
         */
        if (url === CLICK_TRANSITION) {
            log.info('Start checking for page load for click')
            this._clickTraceTimeout = setTimeout(async () => {
                log.info('No page load detected, canceling trace')
                return this.finishTracing()
            }, FRAME_LOAD_START_TIMEOUT)
        }

        /**
         * register performance observer
         */
        await this._page.evaluateOnNewDocument(registerPerformanceObserverInPage)

        this._waitConditionPromises.push(
            waitForFullyLoaded(this._protocolSession, this._networkMonitor, { timedOut: 1 })
        )
    }

    /**
     * store frame id of frames that are being traced
     */
    async onFrameNavigated (msgObj: Protocol.Page.FrameNavigatedEvent) {
        if (!this.isTracing) {
            return
        }
        /**
         * page load failed, cancel tracing
         */
        if (this._failingFrameLoadIds.includes(msgObj.frame.id)) {
            delete this._traceStart
            this._waitConditionPromises = []
            this._frameId = '"unsuccessful loaded frame"'
            this.finishTracing()
            this.emit('tracingError', new Error(`Page with url "${msgObj.frame.url}" failed to load`))

            if (this._clickTraceTimeout) {
                clearTimeout(this._clickTraceTimeout)
            }
        }

        /**
         * ignore event if
         */
        if (
            // we already detected a frameId before
            this._frameId ||
            // the event was thrown for a sub frame (e.g. iframe)
            msgObj.frame.parentId ||
            // we don't support the url of given frame
            !isSupportedUrl(msgObj.frame.url)
        ) {
            log.info(`Ignore navigated frame with url ${msgObj.frame.url}`)
            return
        }

        this._frameId = msgObj.frame.id
        this._loaderId = msgObj.frame.loaderId
        this._pageUrl = msgObj.frame.url
        log.info(`Page load detected: ${this._pageUrl}, set frameId ${this._frameId}, set loaderId ${this._loaderId}`)

        /**
         * clear click tracing timeout if it's still waiting
         *
         * the reason we have to tie this to Page.frameNavigated instead of Page.frameStartedLoading
         * is because the latter can sometimes occur without the former, which will cause a hang
         * e.g. with duolingo's sign-in button
         */
        if (this._clickTraceTimeout && !this._pageLoadDetected) {
            log.info('Page load detected for click, clearing click trace timeout}')
            this._pageLoadDetected = true
            clearTimeout(this._clickTraceTimeout)
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
         */
        const loadPromise = Promise.all(this._waitConditionPromises).then(() => async () => {
            /**
             * ensure that we trace at least for 5s to ensure that we can
             * calculate "interactive"
             */
            const minTraceTime = TRACING_TIMEOUT - (Date.now() - (this._traceStart || 0))
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

        this._waitConditionPromises = []
        return cleanupFn()
    }

    onFrameLoadFail (request: HTTPRequest) {
        const frame = request.frame()

        if (frame) {
            this._failingFrameLoadIds.push(frame._id)
        }
    }

    get isTracing () {
        return typeof this._traceStart === 'number'
    }

    /**
     * once tracing has finished capture trace logs into memory
     */
    async completeTracing () {
        const traceDuration = Date.now() - (this._traceStart || 0)
        log.info(`Tracing completed after ${traceDuration}ms, capturing performance data for frame ${this._frameId}`)

        /**
         * download all tracing data
         * in case it fails, continue without capturing any data
         */
        try {
            const traceEvents = await this._driver.endTrace()

            /**
             * modify pid of renderer frame to be the same as where tracing was started
             * possibly related to https://github.com/GoogleChrome/lighthouse/issues/6968
             */
            const startedInBrowserEvt = traceEvents.traceEvents.find(e => e.name === 'TracingStartedInBrowser')
            const mainFrame = (
                startedInBrowserEvt &&
                startedInBrowserEvt.args &&
                (startedInBrowserEvt.args as StartedInBrowserEvent).data.frames?.find((frame: any) => !frame.parent)
            )
            if (mainFrame && mainFrame.processId) {
                const threadNameEvt = traceEvents.traceEvents.find(e => e.ph === 'R' &&
                    e.cat === 'blink.user_timing' && e.name === 'navigationStart' && (e.args as NavigationStartEvent).data.isLoadingMainFrame)
                if (threadNameEvt) {
                    log.info(`Replace mainFrame process id ${mainFrame.processId} with actual thread process id ${threadNameEvt.pid}`)
                    mainFrame.processId = threadNameEvt.pid
                } else {
                    log.info(`Couldn't replace mainFrame process id ${mainFrame.processId} with actual thread process id`)
                }
            }

            this._trace = {
                ...traceEvents,
                frameId: this._frameId,
                loaderId: this._loaderId,
                pageUrl: this._pageUrl,
                traceStart: this._traceStart,
                traceEnd: Date.now()
            }
            this.emit('tracingComplete', this._trace)
            this.finishTracing()
        } catch (err: any) {
            log.error(`Error capturing tracing logs: ${err.stack}`)
            this.emit('tracingError', err)
            return this.finishTracing()
        }
    }

    /**
     * clear tracing states and emit tracingFinished
     */
    finishTracing () {
        log.info(`Tracing for ${this._frameId} completed`)
        this._pageLoadDetected = false

        /**
         * clean up the listeners
         */
        NETWORK_RECORDER_EVENTS.forEach(
            (method) => this._session.off(method, this._networkListeners[method]))
        delete this._networkStatusMonitor

        delete this._traceStart
        delete this._frameId
        delete this._loaderId
        delete this._pageUrl
        this._failingFrameLoadIds = []
        this._waitConditionPromises = []
        this.emit('tracingFinished')
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
