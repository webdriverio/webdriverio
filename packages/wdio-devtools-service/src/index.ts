import type { Capabilities, Services, FunctionProperties, ThenArg } from '@wdio/types'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'

import CommandHandler from './commands.js'
import type Auditor from './auditor.js'
import { setUnsupportedCommand, getLighthouseDriver } from './utils.js'
import { DEFAULT_THROTTLE_STATE, NETWORK_STATES } from './constants.js'
import type {
    DevtoolsConfig, EnablePerformanceAuditsOptions,
    DeviceDescription, PWAAudits
} from './types.js'

export default class DevToolsService implements Services.ServiceInstance {
    private _command: CommandHandler[] = []

    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    constructor (private _options: DevtoolsConfig) {}

    async before (
        caps: Capabilities.RemoteCapability,
        specs: string[],
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser
        return await this._setupHandler()
    }

    async onReload () {
        if (!this._browser) {
            return
        }

        return this._setupHandler()
    }

    async beforeCommand (commandName: string, params: any[]) {
        return Promise.all(this._command.map(async c => await c._beforeCmd(commandName, params)))
    }

    async afterCommand (commandName: string) {
        if (commandName === 'switchToWindow') {
            await this._setupHandler()
        }

        return Promise.all(this._command.map(async c => await c._afterCmd(commandName)))
    }

    async after () {
        for (const c of this._command) {
            await c._logCoverage()
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

        if (this._command.length === 1) {
            this._command[0].enablePerformanceAudits({ networkThrottling, cpuThrottling, cacheEnabled, formFactor })
        } else {
            for (const c of this._command) {
                c.enablePerformanceAudits({ networkThrottling, cpuThrottling, cacheEnabled, formFactor })
            }
        }
    }

    /**
     * custom command to disable performance audits
     */
    _disablePerformanceAudits () {
        if (this._command.length === 1) {
            this._command[0].disablePerformanceAudits()
        } else {
            for (const c of this._command) {
                c.disablePerformanceAudits()
            }
        }
    }

    /**
     * set device emulation
     */
    async _emulateDevice (device: string | DeviceDescription, inLandscape?: boolean) {
        if (this._command.length === 1) {
            return await this._command[0].emulateDevice(device, inLandscape)
        }

        return Promise.all(this._command.map(async c => await c.emulateDevice(device, inLandscape)))
    }

    async _setThrottlingProfile(
        networkThrottling = DEFAULT_THROTTLE_STATE.networkThrottling,
        cpuThrottling: number = DEFAULT_THROTTLE_STATE.cpuThrottling,
        cacheEnabled: boolean = DEFAULT_THROTTLE_STATE.cacheEnabled
    ) {
        if (this._command.length === 1) {
            this._command[0].setThrottlingProfile(networkThrottling, cpuThrottling, cacheEnabled)
        } else {
            for (const c of this._command) {
                c.setThrottlingProfile(networkThrottling, cpuThrottling, cacheEnabled)
            }
        }
    }

    async _checkPWA (auditsToBeRun?: PWAAudits[]) {
        if (this._command.length === 1) {
            return await this._command[0].checkPWA(auditsToBeRun)
        }
        return Promise.all(this._command.map(async c => await c.checkPWA(auditsToBeRun)))
    }

    async _getCoverageReport () {
        if (this._command.length === 1) {
            return this._command[0].getCoverageReport()
        }

        return await Promise.all(this._command.map(c => c.getCoverageReport()))
    }

    _cdp (domain: string, command: string, args = {}) {
        if (this._command.length === 1) {
            return this._command[0].cdp(domain, command, args)
        }

        return Promise.all(this._command.map(async c => await c.cdp(domain, command, args)))
    }

    async _setupHandler () {
        if (!this._browser) {
            return
        }

        /**
         * In case of switchToWindow, needs to not add more commands to the array
         */
        this._command.length = 0

        /**
         * To avoid if-else, gather all browser instances into an array
         */
        const browsers = Object.keys(this._browser).includes('sessionId') ?
            [this._browser] :
            (this._browser as WebdriverIO.MultiRemoteBrowser).instances.map(i => (this._browser as WebdriverIO.MultiRemoteBrowser).getInstance(i))

        for (const browser of browsers) {
            const puppeteer = await (browser as WebdriverIO.Browser).getPuppeteer().catch(() => undefined) as any as PuppeteerBrowser
            if (!puppeteer) {
                return setUnsupportedCommand(browser as WebdriverIO.Browser)
            }

            /* istanbul ignore next */
            if (!puppeteer) {
                throw new Error('Could not initiate Puppeteer instance')
            }

            const url = await (browser as WebdriverIO.Browser).getUrl()
            const target = url !== 'data:,' ?
                await puppeteer.waitForTarget(
                /* istanbul ignore next */
                    (t) => t.url().includes(url)) :
                await puppeteer.waitForTarget(
                    /* istanbul ignore next */
                    (t) => t.type() === 'page' || Boolean(t._getTargetInfo().browserContextId))

            /* istanbul ignore next */
            if (!target) {
                throw new Error('No page target found')
            }

            const page = await target.page() || null
            /* istanbul ignore next */
            if (!page) {
                throw new Error('No page found')
            }

            const session = await target.createCDPSession()
            const driver = await getLighthouseDriver(session, target)

            const cmd = new CommandHandler(session, page, driver, this._options, browser)
            await cmd._initCommand()
            this._command.push(cmd)
        }

        this._browser.addCommand('enablePerformanceAudits', this._enablePerformanceAudits.bind(this))
        this._browser.addCommand('disablePerformanceAudits', this._disablePerformanceAudits.bind(this))
        this._browser.addCommand('emulateDevice', this._emulateDevice.bind(this))
        this._browser.addCommand('checkPWA', this._checkPWA.bind(this))
        this._browser.addCommand('getCoverageReport', this._getCoverageReport.bind(this))
        this._browser.addCommand('cdp', this._cdp.bind(this))
    }
}

export * from './types.js'

type CommandHandlerCommands = FunctionProperties<CommandHandler>
type AuditorCommands = Omit<FunctionProperties<Auditor>, '_audit' | '_auditPWA' | 'updateCommands'>

/**
 * ToDo(Christian): use key remapping with TS 4.1
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types
 */
interface BrowserExtension extends CommandHandlerCommands, AuditorCommands {}

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
