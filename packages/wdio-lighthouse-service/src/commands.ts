import logger from '@wdio/logger'

import type { TraceEvent } from '@tracerbench/trace-event'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import type { TracingOptions } from 'puppeteer-core/lib/esm/puppeteer/common/Tracing.js'

import type { RequestPayload } from './handler/network.js'
import NetworkHandler from './handler/network.js'

import { CLICK_TRANSITION, DEFAULT_THROTTLE_STATE, DEFAULT_TRACING_CATEGORIES, NETWORK_STATES } from './constants.js'
import { sumByKey } from './utils.js'
import type {
    EnablePerformanceAuditsOptions,
    FormFactor,
    GathererDriver,
    PWAAudits
} from './types.js'
import DevtoolsGatherer from './gatherer/devtools.js'
import Auditor from './auditor.js'
import PWAGatherer from './gatherer/pwa.js'
import TraceGatherer from './gatherer/trace.js'

const log = logger('@wdio/lighthouse-service:CommandHandler')
const TRACE_COMMANDS = ['click', 'navigateTo', 'url']

export default class CommandHandler {
    private _isTracing = false
    private _networkHandler: NetworkHandler
    private _traceEvents?: TraceEvent[]

    private _shouldRunPerformanceAudits = false

    private _cacheEnabled?: boolean
    private _cpuThrottling?: number
    private _networkThrottling?: keyof typeof NETWORK_STATES
    private _formFactor?: FormFactor

    private _traceGatherer?: TraceGatherer
    private _devtoolsGatherer?: DevtoolsGatherer
    private _pwaGatherer?: PWAGatherer

    constructor (
        private _session: CDPSession,
        private _page: Page,
        private _driver: GathererDriver,
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._networkHandler = new NetworkHandler(_session)
        this._traceGatherer = new TraceGatherer(_session, _page, _driver)
        this._pwaGatherer = new PWAGatherer(_session, _page, _driver)

        _session.on('Page.loadEventFired', this._traceGatherer.onLoadEventFired.bind(this._traceGatherer))
        _session.on('Page.frameNavigated', this._traceGatherer.onFrameNavigated.bind(this._traceGatherer))

        _page.on('requestfailed', this._traceGatherer.onFrameLoadFail.bind(this._traceGatherer))

        this._pwaGatherer = new PWAGatherer(_session, _page, _driver)

        /**
         * register browser commands
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => _browser.addCommand(
            fnName,
            this[fnName as keyof CommandHandler].bind(this)
        ))

        this._devtoolsGatherer = new DevtoolsGatherer()
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
            if (!traceBuffer) {
                throw new Error('No tracebuffer captured')
            }
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

    /**
     * set flag to run performance audits for page transitions
     */
    enablePerformanceAudits ({ networkThrottling, cpuThrottling, cacheEnabled, formFactor }: EnablePerformanceAuditsOptions = DEFAULT_THROTTLE_STATE) {
        if (!NETWORK_STATES[networkThrottling]) {
            throw new Error(`Network throttling profile "${networkThrottling}" is unknown, choose between ${Object.keys(NETWORK_STATES).join(', ')}`)
        }

        if (typeof cpuThrottling !== 'number') {
            throw new Error(`CPU throttling rate needs to be typeof number but was "${typeof cpuThrottling}"`)
        }

        this._networkThrottling = networkThrottling
        this._cpuThrottling = cpuThrottling
        this._cacheEnabled = Boolean(cacheEnabled)
        this._formFactor = formFactor
        this._shouldRunPerformanceAudits = true
    }

    /**
     * custom command to disable performance audits
     */
    disablePerformanceAudits () {
        this._shouldRunPerformanceAudits = false
    }

    /**
     * helper method to set throttling profile
     */
    async setThrottlingProfile(
        networkThrottling = DEFAULT_THROTTLE_STATE.networkThrottling,
        cpuThrottling: number = DEFAULT_THROTTLE_STATE.cpuThrottling,
        cacheEnabled: boolean = DEFAULT_THROTTLE_STATE.cacheEnabled
    ) {
        if (!this._page || !this._session) {
            throw new Error('No page or session has been captured yet')
        }

        await this._page.setCacheEnabled(Boolean(cacheEnabled))
        await this._session.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottling })
        await this._session.send('Network.emulateNetworkConditions', NETWORK_STATES[networkThrottling])
    }

    async checkPWA (auditsToBeRun?: PWAAudits[]) {
        const auditor = new Auditor()
        const artifacts = await this._pwaGatherer!.gatherData()
        return auditor._auditPWA(artifacts, auditsToBeRun)
    }

    async _initCommand () {
        /**
         * enable domains for client
         */
        await Promise.all(['Page', 'Network', 'Runtime'].map(
            (domain) => Promise.all([
                this._session?.send(`${domain}.enable` as any)
            ])
        ))
    }

    _beforeCmd (commandName: string, params: any[]) {
        const isCommandNavigation = ['url', 'navigateTo'].some(cmdName => cmdName === commandName)
        if (!this._shouldRunPerformanceAudits || !this._traceGatherer || this._traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * set browser profile
         */
        this.setThrottlingProfile(this._networkThrottling, this._cpuThrottling, this._cacheEnabled)

        const url = isCommandNavigation
            ? params[0]
            : CLICK_TRANSITION
        return this._traceGatherer.startTracing(url)
    }

    _afterCmd (commandName: string) {
        if (!this._traceGatherer || !this._traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * update custom commands once tracing finishes
         */
        this._traceGatherer.once('tracingComplete', (traceEvents) => {
            const auditor = new Auditor(traceEvents, this._devtoolsGatherer?.getLogs(), this._formFactor)
            auditor.updateCommands(this._browser as WebdriverIO.Browser)
        })

        this._traceGatherer.once('tracingError', (err: Error) => {
            const auditor = new Auditor()
            auditor.updateCommands(this._browser as WebdriverIO.Browser, /* istanbul ignore next */() => {
                throw new Error(`Couldn't capture performance due to: ${err.message}`)
            })
        })

        return new Promise<void>((resolve) => {
            log.info(`Wait until tracing for command ${commandName} finishes`)

            /**
             * wait until tracing stops
             */
            this._traceGatherer?.once('tracingFinished', async () => {
                log.info('Disable throttling')
                await this.setThrottlingProfile('online', 0, true)

                log.info('continuing with next WebDriver command')
                resolve()
            })
        })
    }
}
