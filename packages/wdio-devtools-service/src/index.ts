import logger from '@wdio/logger'
import puppeteerCore from 'puppeteer-core'

import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Viewport } from 'puppeteer-core/lib/cjs/puppeteer/common/PuppeteerViewport'
import type { Browser } from 'puppeteer-core/lib/cjs/puppeteer/common/Browser'
import type { Target } from 'puppeteer-core/lib/cjs/puppeteer/common/Target'

import CommandHandler from './commands'
import Auditor from './auditor'
import TraceGatherer from './gatherer/trace'
import DevtoolsGatherer, { CDPSessionOnMessageObject } from './gatherer/devtools'
import { isBrowserSupported, setUnsupportedCommand } from './utils'
import { NETWORK_STATES, UNSUPPORTED_ERROR_MESSAGE, CLICK_TRANSITION, DEFAULT_THROTTLE_STATE } from './constants'

const log = logger('@wdio/devtools-service')
const TRACE_COMMANDS = ['click', 'navigateTo', 'url']

interface EnablePerformanceAuditsOptions {
    cacheEnabled: boolean
    cpuThrottling: number
    networkThrottling: keyof typeof NETWORK_STATES
}

interface DeviceDescription {
    viewport: Viewport;
    userAgent: string;
}

interface Device {
    name: string;
    userAgent: string;
    viewport: {
        width: number;
        height: number;
        deviceScaleFactor: number;
        isMobile: boolean;
        hasTouch: boolean;
        isLandscape: boolean;
    };
}

export default class DevToolsService implements WebdriverIO.HookFunctions {
    private _isSupported = false
    private _shouldRunPerformanceAudits = false

    private _puppeteer?: Browser
    private _target?: Target
    private _page: Page | null = null
    private _session?: CDPSession
    private _cacheEnabled?: boolean
    private _cpuThrottling?: number
    private _networkThrottling?: keyof typeof NETWORK_STATES
    private _traceGatherer?: TraceGatherer
    private _devtoolsGatherer?: DevtoolsGatherer

    beforeSession (_: WebdriverIO.Config, caps: WebDriver.DesiredCapabilities) {
        if (!isBrowserSupported(caps)) {
            return log.error(UNSUPPORTED_ERROR_MESSAGE)
        }
        this._isSupported = true
    }

    async onReload () {
        // resetting puppeteer on sessionReload, so a new puppeteer session will be attached
        global.browser.puppeteer = null
        return this._setupHandler()
    }

    async before () {
        this._isSupported = this._isSupported || Boolean(global.browser.puppeteer)
        return this._setupHandler()
    }

    async beforeCommand (commandName: string, params: any[]) {
        if (!this._shouldRunPerformanceAudits || !this._traceGatherer || this._traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * set browser profile
         */
        this._setThrottlingProfile(this._networkThrottling, this._cpuThrottling, this._cacheEnabled)

        const url = ['url', 'navigateTo'].some(cmdName => cmdName === commandName)
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
            const auditor = new Auditor(traceEvents, this._devtoolsGatherer?.getLogs())
            auditor.updateCommands(global.browser as WebdriverIO.BrowserObject)
        })

        this._traceGatherer.once('tracingError', (err: Error) => {
            const auditor = new Auditor()
            auditor.updateCommands(global.browser as WebdriverIO.BrowserObject, /* istanbul ignore next */() => {
                throw new Error(`Couldn't capture performance due to: ${err.message}`)
            })
        })

        return new Promise((resolve) => {
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

    /**
     * set flag to run performance audits for page transitions
     */
    _enablePerformanceAudits ({ networkThrottling, cpuThrottling, cacheEnabled }: EnablePerformanceAuditsOptions = DEFAULT_THROTTLE_STATE) {
        if (!NETWORK_STATES[networkThrottling]) {
            throw new Error(`Network throttling profile "${networkThrottling}" is unknown, choose between ${Object.keys(NETWORK_STATES).join(', ')}`)
        }

        if (typeof cpuThrottling !== 'number') {
            throw new Error(`CPU throttling rate needs to be typeof number but was "${typeof cpuThrottling}"`)
        }

        this._networkThrottling = networkThrottling
        this._cpuThrottling = cpuThrottling
        this._cacheEnabled = Boolean(cacheEnabled)
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
            const deviceName = device + (inLandscape ? ' landscape' : '')
            const deviceCapabilities = puppeteerCore.devices[deviceName]
            if (!deviceCapabilities) {
                const deviceNames = (puppeteerCore.devices as any)
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
        cpuThrottling = DEFAULT_THROTTLE_STATE.cpuThrottling,
        cacheEnabled = DEFAULT_THROTTLE_STATE.cacheEnabled
    ) {
        if (!this._page || !this._session) {
            throw new Error('No page or session has been captured yet')
        }

        await this._page.setCacheEnabled(Boolean(cacheEnabled))
        await this._session.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottling })
        await this._session.send('Network.emulateNetworkConditions', NETWORK_STATES[networkThrottling])
    }

    async _setupHandler () {
        if (!this._isSupported) {
            return setUnsupportedCommand(global.browser as WebdriverIO.BrowserObject)
        }

        this._puppeteer = await global.browser.getPuppeteer() as unknown as Browser
        /* istanbul ignore next */
        if (!this._puppeteer) {
            throw new Error('Could not initiate Puppeteer instance')
        }

        this._target = await this._puppeteer.waitForTarget(
            /* istanbul ignore next */
            (t) => t.type() === 'page')
        /* istanbul ignore next */
        if (!this._target) {
            throw new Error('No page target found')
        }

        this._page = await this._target.page()
        /* istanbul ignore next */
        if (!this._page) {
            throw new Error('No page found')
        }

        this._session = await this._target.createCDPSession()

        new CommandHandler(this._session, this._page)
        this._traceGatherer = new TraceGatherer(this._session, this._page)

        this._session.on('Page.loadEventFired', this._traceGatherer.onLoadEventFired.bind(this._traceGatherer))
        this._session.on('Page.frameNavigated', this._traceGatherer.onFrameNavigated.bind(this._traceGatherer))

        this._page.on('requestfailed', this._traceGatherer.onFrameLoadFail.bind(this._traceGatherer))

        /**
         * enable domains for client
         */
        await Promise.all(['Page', 'Network', 'Console'].map(
            (domain) => Promise.all([
                this._session?.send(`${domain}.enable` as any)
            ])
        ))

        this._devtoolsGatherer = new DevtoolsGatherer()
        this._puppeteer['_connection']._transport._ws.addEventListener('message', (event: { data: string }) => {
            const data: CDPSessionOnMessageObject = JSON.parse(event.data)
            this._devtoolsGatherer?.onMessage(data)
            const method = data.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(data.params)}`)
            global.browser.emit(method, data.params)
        })

        global.browser.addCommand('enablePerformanceAudits', this._enablePerformanceAudits.bind(this))
        global.browser.addCommand('disablePerformanceAudits', this._disablePerformanceAudits.bind(this))
        global.browser.addCommand('emulateDevice', this._emulateDevice.bind(this))
    }
}
