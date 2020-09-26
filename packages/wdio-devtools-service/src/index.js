import logger from '@wdio/logger'
import puppeteerCore from 'puppeteer-core'

import CommandHandler from './commands'
import Auditor from './auditor'
import TraceGatherer from './gatherer/trace'
import DevtoolsGatherer from './gatherer/devtools'
import { isBrowserSupported, setUnsupportedCommand } from './utils'
import { NETWORK_STATES, DEFAULT_NETWORK_THROTTLING_STATE, UNSUPPORTED_ERROR_MESSAGE, CLICK_TRANSITION } from './constants'

const log = logger('@wdio/devtools-service')
const TRACE_COMMANDS = ['click', 'navigateTo', 'url']

export default class DevToolsService {
    constructor() {
        this.isSupported = false
        this.shouldRunPerformanceAudits = false
    }

    beforeSession(_, caps) {
        if (!isBrowserSupported(caps)) {
            return log.error(UNSUPPORTED_ERROR_MESSAGE)
        }
        this.isSupported = true
    }

    async onReload() {
        return this._setupHandler()
    }

    async before() {
        this.isSupported = this.isSupported || Boolean(global.browser.puppeteer)
        return this._setupHandler()
    }

    async beforeCommand(commandName, params) {
        if (!this.shouldRunPerformanceAudits || !this.traceGatherer || this.traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * set browser profile
         */
        this._setThrottlingProfile(this.networkThrottling, this.cpuThrottling, this.cacheEnabled)

        const url = ['url', 'navigateTo'].some(cmdName => cmdName === commandName) ? params[0] : CLICK_TRANSITION
        return this.traceGatherer.startTracing(url)
    }

    async afterCommand(commandName) {
        if (!this.traceGatherer || !this.traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * update custom commands once tracing finishes
         */
        this.traceGatherer.once('tracingComplete', (traceEvents) => {
            const auditor = new Auditor(traceEvents, this.devtoolsGatherer.getLogs())
            auditor.updateCommands(global.browser)
        })

        this.traceGatherer.once('tracingError', (err) => {
            const auditor = new Auditor()
            auditor.updateCommands(global.browser, /* istanbul ignore next */() => {
                throw new Error(`Couldn't capture performance due to: ${err.message}`)
            })
        })

        return new Promise((resolve) => {
            log.info(`Wait until tracing for command ${commandName} finishes`)

            /**
             * wait until tracing stops
             */
            this.traceGatherer.once('tracingFinished', async () => {
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
    _enablePerformanceAudits({ networkThrottling = DEFAULT_NETWORK_THROTTLING_STATE, cpuThrottling = 4, cacheEnabled = false } = {}) {
        if (!Object.prototype.hasOwnProperty.call(NETWORK_STATES, networkThrottling)) {
            throw new Error(`Network throttling profile "${networkThrottling}" is unknown, choose between ${Object.keys(NETWORK_STATES).join(', ')}`)
        }

        if (typeof cpuThrottling !== 'number') {
            throw new Error(`CPU throttling rate needs to be typeof number but was "${typeof cpuThrottling}"`)
        }

        this.networkThrottling = networkThrottling
        this.cpuThrottling = cpuThrottling
        this.cacheEnabled = Boolean(cacheEnabled)
        this.shouldRunPerformanceAudits = true
    }

    /**
     * custom command to disable performance audits
     */
    _disablePerformanceAudits() {
        this.shouldRunPerformanceAudits = false
    }

    /**
     * set device emulation
     */
    async _emulateDevice(device, inLandscape) {
        if (typeof device === 'string') {
            const deviceName = device + (inLandscape ? ' landscape' : '')
            const deviceCapabilities = puppeteerCore.devices[deviceName]
            if (!deviceCapabilities) {
                const deviceNames = puppeteerCore.devices
                    .map((device) => device.name)
                    .filter((device) => !device.endsWith('landscape'))
                throw new Error(`Unknown device, available options: ${deviceNames.join(', ')}`)
            }

            return this.page.emulate(deviceCapabilities)
        }

        return this.page.emulate(device)
    }

    /**
     * helper method to set throttling profile
     */
    async _setThrottlingProfile(networkThrottling, cpuThrottling, cacheEnabled) {
        await this.page.setCacheEnabled(Boolean(cacheEnabled))
        await this.session.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottling })
        await this.session.send('Network.emulateNetworkConditions', NETWORK_STATES[networkThrottling])
    }

    async _setupHandler() {
        if (!this.isSupported) {
            return setUnsupportedCommand()
        }

        this.puppeteer = await global.browser.getPuppeteer()
        this.target = await this.puppeteer.waitForTarget(
            /* istanbul ignore next */
            (t) => t.type() === 'page')
        this.page = await this.target.page()
        this.session = await this.target.createCDPSession()

        this.commandHandler = new CommandHandler(this.session, this.page)
        this.traceGatherer = new TraceGatherer(this.puppeteer, this.session, this.page)

        this.session.on('Page.loadEventFired', this.traceGatherer.onLoadEventFired.bind(this.traceGatherer))
        this.session.on('Page.frameNavigated', this.traceGatherer.onFrameNavigated.bind(this.traceGatherer))

        this.page.on('requestfailed', this.traceGatherer.onFrameLoadFail.bind(this.traceGatherer))

        /**
         * enable domains for client
         */
        await Promise.all(['Page', 'Network', 'Console'].map(
            (domain) => Promise.all([
                this.session.send(`${domain}.enable`)
            ])
        ))

        this.devtoolsGatherer = new DevtoolsGatherer()
        this.puppeteer._connection._transport._ws.addEventListener('message', (event) => {
            const data = JSON.parse(event.data)
            this.devtoolsGatherer.onMessage(data)
            const method = data.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(data.params)}`)
            global.browser.emit(method, data.params)
        })

        global.browser.addCommand('enablePerformanceAudits', this._enablePerformanceAudits.bind(this))
        global.browser.addCommand('disablePerformanceAudits', this._disablePerformanceAudits.bind(this))
        global.browser.addCommand('emulateDevice', this._emulateDevice.bind(this))
    }
}
