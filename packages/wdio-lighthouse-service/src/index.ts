import type { Capabilities, Services, FunctionProperties, ThenArg } from '@wdio/types'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'

import CommandHandler from './commands.js'
import type Auditor from './auditor.js'
import { setUnsupportedCommand, getLighthouseDriver } from './utils.js'
import { DEFAULT_THROTTLE_STATE, NETWORK_STATES } from './constants.js'
import type { DevtoolsConfig, EnablePerformanceAuditsOptions, PWAAudits } from './types.js'

export default class DevToolsService implements Services.ServiceInstance {
    private _command: CommandHandler[] = []
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    constructor (private _options: DevtoolsConfig) {}

    async before (
        caps: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities,
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

    async beforeCommand (commandName: string, params: unknown[]) {
        return Promise.all(this._command.map(async c => await c._beforeCmd(commandName, params)))
    }

    async afterCommand (commandName: string) {
        if (commandName === 'switchToWindow') {
            await this._setupHandler()
        }

        return Promise.all(this._command.map(async c => await c._afterCmd(commandName)))
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
            const puppeteer = await (browser as WebdriverIO.Browser).getPuppeteer().catch(() => undefined) as unknown as PuppeteerBrowser
            if (!puppeteer) {
                return setUnsupportedCommand(browser as WebdriverIO.Browser)
            }

            const url = await (browser as WebdriverIO.Browser).getUrl()
            const target = url !== 'data:,'
                ? await puppeteer.waitForTarget(
                    async (t) => (
                        t.url().includes(url) &&
                        !t.url().includes('BiDi-CDP Mapper') &&
                        Boolean(await t.page())
                    )
                )
                : await puppeteer.waitForTarget(
                    async (t) => (
                        t.type() === 'page' ||
                        // @ts-expect-error
                        Boolean(t._getTargetInfo().browserContextId) &&
                        !!(await t.page())
                    )
                )

            if (!target) {
                throw new Error('No page target found')
            }

            const page = await target.page()
            if (!page) {
                throw new Error('No page found')
            }

            const session = await target.createCDPSession()
            const driver = await getLighthouseDriver(session, target)

            const cmd = new CommandHandler(session, page, driver, this._options, browser)
            await cmd._initCommand()
            this._command.push(cmd)
        }

        ;(this._browser.addCommand as (name: string, func: Function) => void)('enablePerformanceAudits', this._enablePerformanceAudits.bind(this))
        ;(this._browser.addCommand as (name: string, func: Function) => void)('disablePerformanceAudits', this._disablePerformanceAudits.bind(this))
        ;(this._browser.addCommand as (name: string, func: Function) => void)('checkPWA', this._checkPWA.bind(this))
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
