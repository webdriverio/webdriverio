import logger from '@wdio/logger'
import { KnownDevices } from 'puppeteer-core'

import type { Capabilities, Services, FunctionProperties, ThenArg } from '@wdio/types'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'
import type { Target } from 'puppeteer-core/lib/esm/puppeteer/common/Target.js'

import CommandHandler from './commands.js'
import Auditor from './auditor.js'
import PWAGatherer from './gatherer/pwa.js'
import TraceGatherer from './gatherer/trace.js'
import CoverageGatherer from './gatherer/coverage.js'
import type { CDPSessionOnMessageObject } from './gatherer/devtools.js'
import DevtoolsGatherer from './gatherer/devtools.js'
import { setUnsupportedCommand, getLighthouseDriver } from './utils.js'
import { NETWORK_STATES, CLICK_TRANSITION, DEFAULT_THROTTLE_STATE } from './constants.js'
import type {
    DevtoolsConfig, FormFactor, EnablePerformanceAuditsOptions,
    DeviceDescription, Device, PWAAudits, GathererDriver
} from './types.js'

const log = logger('@wdio/devtools-service')
const TRACE_COMMANDS = ['click', 'navigateTo', 'url']

function isCDPSessionOnMessageObject(
    data: any
): data is CDPSessionOnMessageObject {
    return (
        data !== null &&
        typeof data === 'object' &&
        Object.prototype.hasOwnProperty.call(data, 'params') &&
        Object.prototype.hasOwnProperty.call(data, 'method')
    )
}

export default class DevToolsService implements Services.ServiceInstance {
    private _shouldRunPerformanceAudits = false

    private _puppeteer?: PuppeteerBrowser
    private _target?: Target
    private _page: Page | null = null
    private _session?: CDPSession
    private _driver?: GathererDriver

    private _cacheEnabled?: boolean
    private _cpuThrottling?: number
    private _networkThrottling?: keyof typeof NETWORK_STATES
    private _formFactor?: FormFactor

    private _traceGatherer?: TraceGatherer
    private _devtoolsGatherer?: DevtoolsGatherer
    private _coverageGatherer?: CoverageGatherer
    private _pwaGatherer?: PWAGatherer
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    constructor (private _options: DevtoolsConfig) {}

    before (
        caps: Capabilities.RemoteCapability,
        specs: string[],
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser
        return this._setupHandler()
    }

    async onReload () {
        if (!this._browser) {
            return
        }

        return this._setupHandler()
    }

    async beforeCommand (commandName: string, params: any[]) {
        const isCommandNavigation = ['url', 'navigateTo'].some(cmdName => cmdName === commandName)
        if (!this._shouldRunPerformanceAudits || !this._traceGatherer || this._traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * set browser profile
         */
        this._setThrottlingProfile(this._networkThrottling, this._cpuThrottling, this._cacheEnabled)

        const url = isCommandNavigation
            ? params[0]
            : CLICK_TRANSITION
        return this._traceGatherer.startTracing(url)
    }

    async afterCommand (commandName: string) {
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
                await this._setThrottlingProfile('online', 0, true)

                log.info('continuing with next WebDriver command')
                resolve()
            })
        })
    }

    async after () {
        if (this._coverageGatherer) {
            await this._coverageGatherer.logCoverage()
        }
    }

    /**
     * set flag to run performance audits for page transitions
     */
    _enablePerformanceAudits ({ networkThrottling, cpuThrottling, cacheEnabled, formFactor }: EnablePerformanceAuditsOptions = DEFAULT_THROTTLE_STATE) {
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
    _disablePerformanceAudits () {
        this._shouldRunPerformanceAudits = false
    }

    /**
     * set device emulation
     */
    async _emulateDevice (device: string | DeviceDescription, inLandscape?: boolean) {
        if (!this._page) {
            throw new Error('No page has been captured yet')
        }

        if (typeof device === 'string') {
            const deviceName = device + (inLandscape ? ' landscape' : '') as keyof typeof KnownDevices
            const deviceCapabilities = KnownDevices[deviceName]
            if (!deviceCapabilities) {
                const deviceNames = Object.values(KnownDevices)
                    .map((device: Device) => device.name)
                    .filter((device: string) => !device.endsWith('landscape'))
                throw new Error(`Unknown device, available options: ${deviceNames.join(', ')}`)
            }

            return this._page.emulate(deviceCapabilities)
        }

        return this._page.emulate(device)
    }

    /**
     * helper method to set throttling profile
     */
    async _setThrottlingProfile(
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

    async _checkPWA (auditsToBeRun?: PWAAudits[]) {
        const auditor = new Auditor()
        const artifacts = await this._pwaGatherer!.gatherData()
        return auditor._auditPWA(artifacts, auditsToBeRun)
    }

    _getCoverageReport () {
        return this._coverageGatherer!.getCoverageReport()
    }

    async _setupHandler () {
        if (!this._browser) {
            return
        }

        /**
         * casting is required as types differ between core and definitely typed types
         */
        this._puppeteer = await (this._browser as WebdriverIO.Browser).getPuppeteer().catch(() => undefined) as any as PuppeteerBrowser
        if (!this._puppeteer) {
            return setUnsupportedCommand(this._browser as WebdriverIO.Browser)
        }

        /* istanbul ignore next */
        if (!this._puppeteer) {
            throw new Error('Could not initiate Puppeteer instance')
        }

        this._target = await this._puppeteer.waitForTarget(
            /* istanbul ignore next */
            (t) => t.type() === 'page' || Boolean(t._getTargetInfo().browserContextId))

        /* istanbul ignore next */
        if (!this._target) {
            throw new Error('No page target found')
        }

        this._page = await this._target.page() || null
        /* istanbul ignore next */
        if (!this._page) {
            throw new Error('No page found')
        }

        this._session = await this._target.createCDPSession()
        this._driver = await getLighthouseDriver(this._session, this._target)

        new CommandHandler(this._session, this._page, this._browser)
        this._traceGatherer = new TraceGatherer(this._session, this._page, this._driver)

        this._session.on('Page.loadEventFired', this._traceGatherer.onLoadEventFired.bind(this._traceGatherer))
        this._session.on('Page.frameNavigated', this._traceGatherer.onFrameNavigated.bind(this._traceGatherer))

        this._page.on('requestfailed', this._traceGatherer.onFrameLoadFail.bind(this._traceGatherer))

        /**
         * enable domains for client
         */
        await Promise.all(['Page', 'Network', 'Runtime'].map(
            (domain) => Promise.all([
                this._session?.send(`${domain}.enable` as any)
            ])
        ))

        /**
         * register coverage gatherer if options is set by user
         */
        if (this._options.coverageReporter?.enable) {
            this._coverageGatherer = new CoverageGatherer(this._page, this._options.coverageReporter)
            this._browser.addCommand('getCoverageReport', this._getCoverageReport.bind(this))
            await this._coverageGatherer.init()
        }

        this._devtoolsGatherer = new DevtoolsGatherer()
        this._session.on('*', this._propagateWSEvents.bind(this))

        this._browser.addCommand('enablePerformanceAudits', this._enablePerformanceAudits.bind(this))
        this._browser.addCommand('disablePerformanceAudits', this._disablePerformanceAudits.bind(this))
        this._browser.addCommand('emulateDevice', this._emulateDevice.bind(this))

        this._pwaGatherer = new PWAGatherer(this._session, this._page, this._driver)
        this._browser.addCommand('checkPWA', this._checkPWA.bind(this))
    }

    private _propagateWSEvents (data: any) {
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
}

export * from './types.js'

type ServiceCommands = Omit<FunctionProperties<DevToolsService>, keyof Services.HookFunctions | '_setupHandler'>
type CommandHandlerCommands = FunctionProperties<CommandHandler>
type AuditorCommands = Omit<FunctionProperties<Auditor>, '_audit' | '_auditPWA' | 'updateCommands'>

/**
 * ToDo(Christian): use key remapping with TS 4.1
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types
 */
interface BrowserExtension extends CommandHandlerCommands, AuditorCommands {
    /**
     * Enables auto performance audits for all page loads that are cause by calling the url command or clicking on a link or anything that causes a page load.
     * You can pass in a config object to determine some throttling options. The default throttling profile is Good 3G network with a 4x CPU trottling.
     */
    enablePerformanceAudits: ServiceCommands['_enablePerformanceAudits']
    /**
     * Disable the performance audits
     */
    disablePerformanceAudits: ServiceCommands['_disablePerformanceAudits']
    /**
     * The service allows you to emulate a specific device type.
     * If set, the browser viewport will be modified to fit the device capabilities as well as the user agent will set according to the device user agent.
     * Note: This only works if you don't use mobileEmulation within capabilities['goog:chromeOptions']. If mobileEmulation is present the call to browser.emulateDevice() won't do anything.
     */
    emulateDevice: ServiceCommands['_emulateDevice']
    /**
     * Throttle network speed of the browser.
     */
    setThrottlingProfile: ServiceCommands['_setThrottlingProfile']
    /**
     * Runs various PWA Lighthouse audits on the current opened page.
     * Read more about Lighthouse PWA audits at https://web.dev/lighthouse-pwa/.
     */
    checkPWA: ServiceCommands['_checkPWA']
    /**
     * Returns the coverage report for the current opened page.
     */
    getCoverageReport: ServiceCommands['_getCoverageReport']
}

export type BrowserExtensionSync = {
    [K in keyof BrowserExtension]: (...args: Parameters<BrowserExtension[K]>) => ThenArg<ReturnType<BrowserExtension[K]>>
}

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends DevtoolsConfig {}
    }

    namespace WebdriverIO {
        interface Browser extends BrowserExtension { }
        interface MultiRemoteBrowser extends BrowserExtension { }
    }
}
