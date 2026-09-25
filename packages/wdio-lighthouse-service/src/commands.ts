import logger from '@wdio/logger'
import { desktopConfig, startFlow } from 'lighthouse'

import type { TraceEvent } from '@tracerbench/trace-event'
import type { CDPSession } from 'puppeteer-core/lib/puppeteer/api/CDPSession.js'
import type { Page } from 'puppeteer-core/lib/puppeteer/api/Page.js'
import type { TracingOptions } from 'puppeteer-core/lib/puppeteer/cdp/Tracing.js'

import type { RequestPayload } from './handler/network.js'
import NetworkHandler from './handler/network.js'

import {
    CLICK_TRANSITION,
    DEFAULT_THROTTLE_STATE,
    DEFAULT_TRACING_CATEGORIES,
    FRAME_LOAD_START_TIMEOUT,
    NETWORK_STATES,
    TRACE_COMMANDS
} from './constants.js'
import {
    describeLighthouseResult,
    getAuditablePuppeteerPage,
    hasCorePerformanceMetrics,
    isSupportedUrl,
    parseTraceBuffer,
    selectLighthouseResult,
    sumByKey
} from './utils.js'
import type {
    DevtoolsConfig,
    EnablePerformanceAuditsOptions,
    FormFactor,
    LighthouseFlow,
    PWAAudits
} from './types.js'
import type { CDPSessionOnMessageObject } from './gatherer/devtools.js'
import DevtoolsGatherer from './gatherer/devtools.js'
import Auditor from './auditor.js'
import PWAAuditor from './pwa.js'

const log = logger('@wdio/lighthouse-service:CommandHandler')

function isCDPSessionOnMessageObject(
    data: unknown
): data is CDPSessionOnMessageObject {
    return (
        data !== null &&
        typeof data === 'object' &&
        Object.prototype.hasOwnProperty.call(data, 'params') &&
        Object.prototype.hasOwnProperty.call(data, 'method')
    )
}

function isTraceCommand (commandName: string): commandName is typeof TRACE_COMMANDS[number] {
    return (TRACE_COMMANDS as readonly string[]).includes(commandName)
}

export default class CommandHandler {
    private _isTracing = false
    private _networkHandler: NetworkHandler
    private _traceEvents?: TraceEvent[]

    private _shouldRunPerformanceAudits = false

    private _cacheEnabled?: boolean
    private _cpuThrottling?: number
    private _networkThrottling?: keyof typeof NETWORK_STATES
    private _formFactor?: FormFactor

    private _devtoolsGatherer?: DevtoolsGatherer
    private _pwaAuditor: PWAAuditor
    private _flow?: LighthouseFlow
    private _flowInProgress = false
    private _pageLoadDetected = false
    private _clickTraceTimeout?: NodeJS.Timeout
    private _onFrameNavigated = this._handleFrameNavigated.bind(this)

    constructor (
        private _session: CDPSession,
        private _page: Page,
        private _options: DevtoolsConfig,
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._networkHandler = new NetworkHandler(_session)
        this._pwaAuditor = new PWAAuditor(_session, _page)

        _session.on('Page.frameNavigated', this._onFrameNavigated)

        /**
         * register browser commands
         */
        const commands = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(
            fnName => fnName !== 'constructor' && !fnName.startsWith('_'))
        commands.forEach(fnName => (_browser as WebdriverIO.Browser /** casting help targeting the non deprecated overload function */).addCommand(
            fnName,
            this[fnName as keyof CommandHandler].bind(this),
            {} // Use the non-deprecated overload with options
        ))

        this._devtoolsGatherer = new DevtoolsGatherer()
        _session.on('*', this._propagateWSEvents.bind(this))
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
            const parsed = parseTraceBuffer(traceBuffer)
            this._traceEvents = (parsed.traceEvents ?? parsed) as TraceEvent[]
            this._isTracing = false
        } catch (err) {
            this._isTracing = false
            throw new Error(`Couldn't parse trace events: ${(err as Error).message}`)
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
        return this._pwaAuditor.audit(auditsToBeRun)
    }

    private _propagateWSEvents (data: unknown) {
        if (!isCDPSessionOnMessageObject(data)) {
            return
        }

        this._devtoolsGatherer?.onMessage(data)
        const method = data.method || 'event'
        try {
            // can fail due to "Cannot convert a Symbol value to a string"
            log.debug(`cdp event: ${method} with params ${JSON.stringify(data.params)}`)
        } catch {
            // ignore
        }
        if (this._browser) {
            this._browser.emit(method, data.params)
        }
    }

    async _initCommand () {
        /**
         * enable domains for client
         */
        await Promise.all(['Page', 'Network', 'Runtime'].map(
            (domain) => Promise.all([
                this._session?.send(`${domain}.enable` as 'Page.enable' | 'Network.enable' | 'Runtime.enable'),
            ])
        ))
    }

    async _beforeCmd (commandName: string, params: unknown[]) {
        const isCommandNavigation = ['url', 'navigateTo'].includes(commandName)
        if (!this._shouldRunPerformanceAudits || this._flowInProgress || !isTraceCommand(commandName)) {
            return
        }

        /**
         * set browser profile
         */
        await this.setThrottlingProfile(this._networkThrottling, this._cpuThrottling, this._cacheEnabled)

        const url = isCommandNavigation
            ? params[0] as string
            : CLICK_TRANSITION

        this._pageLoadDetected = false
        this._flowInProgress = true

        if (url === CLICK_TRANSITION) {
            this._clickTraceTimeout = setTimeout(() => {
                if (!this._pageLoadDetected) {
                    log.info('No page load detected, canceling Lighthouse navigation')
                }
            }, FRAME_LOAD_START_TIMEOUT)
        }

        try {
            await this._refreshAuditablePage()
            this._flow = await startFlow(this._page as never, this._getFlowOptions()) as unknown as LighthouseFlow
            await this._flow.startNavigation({ name: `WebdriverIO ${commandName}` })
        } catch (error) {
            this._resetFlowState()
            throw error
        }
    }

    async _afterCmd (commandName: string) {
        if (!this._flow || !this._flowInProgress || !isTraceCommand(commandName)) {
            return
        }

        const skipClickWithoutNavigation = commandName === 'click' && !this._pageLoadDetected
        try {
            if (skipClickWithoutNavigation) {
                log.info('Click did not trigger a page load, skipping Lighthouse navigation')
                await this._cancelNavigation('click did not trigger a page load')
                return
            }

            await this._flow.endNavigation()
            let lhr = selectLighthouseResult(await this._flow.createFlowResult())

            if (!hasCorePerformanceMetrics(lhr)) {
                log.warn(`Wrapped navigation produced no performance metrics (${describeLighthouseResult(lhr)})`)
                lhr = await this._navigateWithLighthouse() ?? lhr
            }

            if (!hasCorePerformanceMetrics(lhr)) {
                throw new Error(`Lighthouse did not capture core performance metrics (${describeLighthouseResult(lhr)})`)
            }

            log.info(`Captured Lighthouse performance metrics (${describeLighthouseResult(lhr)})`)
            const auditor = new Auditor(lhr, this._formFactor)
            auditor.updateCommands(this._browser as WebdriverIO.Browser)
        } catch (err) {
            log.error(`Couldn't capture performance due to: ${(err as Error).message}`)
            this._disposeFlow()
            const auditor = new Auditor()
            auditor.updateCommands(this._browser as WebdriverIO.Browser, /* istanbul ignore next */() => {
                throw new Error(`Couldn't capture performance due to: ${(err as Error).message}`)
            })
        } finally {
            this._resetFlowState()
            log.info('Disable throttling')
            await this.setThrottlingProfile('online', 0, true)
        }
    }

    private _getFlowOptions () {
        const requestedFormFactor = this._formFactor
        const formFactor = requestedFormFactor === 'mobile' ? 'mobile' as const : 'desktop' as const

        return {
            name: 'WebdriverIO performance flow',
            config: formFactor === 'desktop' ? desktopConfig : undefined,
            flags: {
                formFactor,
                /**
                 * Let Lighthouse apply its own desktop/mobile viewport. The Puppeteer
                 * connection uses `defaultViewport: null`, and headless Chrome on some
                 * CI hosts otherwise paints into a 0×0 window (no FCP / empty LHR).
                 */
                ...(requestedFormFactor === 'none' ? { screenEmulation: { disabled: true } } : {}),
                throttlingMethod: 'provided' as const,
                disableStorageReset: true,
                skipAboutBlank: true,
                onlyCategories: ['performance'],
                logLevel: 'error' as const
            }
        }
    }

    private _handleFrameNavigated (event: { frame?: { parentId?: string, url?: string } }) {
        if (!this._flowInProgress || event.frame?.parentId || !event.frame?.url || !isSupportedUrl(event.frame.url)) {
            return
        }

        this._pageLoadDetected = true
        if (this._clickTraceTimeout) {
            clearTimeout(this._clickTraceTimeout)
            this._clickTraceTimeout = undefined
        }
    }

    private async _refreshAuditablePage () {
        try {
            const puppeteer = this._page.browser()
            const currentUrl = await (this._browser as WebdriverIO.Browser).getUrl()
            const page = await getAuditablePuppeteerPage(puppeteer, currentUrl)
            if (page) {
                this._page = page as Page
            }
        } catch (error) {
            log.debug(`Could not refresh Puppeteer page: ${(error as Error).message}`)
        }
    }

    private async _navigateWithLighthouse () {
        const currentUrl = await (this._browser as WebdriverIO.Browser).getUrl()
        if (!isSupportedUrl(currentUrl)) {
            log.warn(`Cannot fall back to Lighthouse navigate for unsupported url: ${currentUrl}`)
            return undefined
        }

        log.info(`Falling back to Lighthouse-controlled navigation (${currentUrl})`)
        await this._refreshAuditablePage()
        if (!this._flow?.navigate) {
            this._disposeFlow()
            this._flow = await startFlow(this._page as never, this._getFlowOptions()) as unknown as LighthouseFlow
        }
        await this._flow.navigate(currentUrl)
        return selectLighthouseResult(await this._flow.createFlowResult())
    }

    private async _cancelNavigation (reason: string) {
        this._disposeFlow()
        try {
            await Promise.race([
                this._flow?.endNavigation() ?? Promise.resolve(),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(reason)), FRAME_LOAD_START_TIMEOUT)
                })
            ])
        } catch (error) {
            log.debug(`Lighthouse navigation cancelled: ${(error as Error).message}`)
        }

        const auditor = new Auditor()
        auditor.updateCommands(this._browser as WebdriverIO.Browser, /* istanbul ignore next */() => {
            throw new Error(`Couldn't capture performance due to: ${reason}`)
        })
    }

    private _disposeFlow () {
        try {
            this._flow?.dispose?.()
        } catch (error) {
            log.debug(`Failed to dispose Lighthouse flow: ${(error as Error).message}`)
        }
    }

    private _resetFlowState () {
        if (this._clickTraceTimeout) {
            clearTimeout(this._clickTraceTimeout)
            this._clickTraceTimeout = undefined
        }
        this._flow = undefined
        this._flowInProgress = false
        this._pageLoadDetected = false
    }
}
