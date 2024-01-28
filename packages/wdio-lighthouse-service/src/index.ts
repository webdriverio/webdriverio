import logger from '@wdio/logger'
import type { Services, FunctionProperties, ThenArg } from '@wdio/types'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser.js'

import CommandHandler from './commands.js'
import type Auditor from './auditor.js'
import { setUnsupportedCommand, getLighthouseDriver } from './utils.js'
import { DEFAULT_THROTTLE_STATE, NETWORK_STATES } from './constants.js'
import type { EnablePerformanceAuditsOptions, PWAAudits } from './types.js'

const log = logger('@wdio/lighthouse-service')

export default class LighthouseService implements Services.ServiceInstance {
    #browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    /**
     * holds all command handler instances, e.g. if we use multiremote, we have multiple
     */
    #commandHandler: CommandHandler[] = []

    async before (
        _: unknown, // caps: Capabilities.RemoteCapability,
        __: unknown, // specs: string[],
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this.#browser = browser
        return await this.#setupHandler()
    }

    async onReload () {
        if (!this.#browser) {
            return
        }

        return this.#setupHandler()
    }

    async beforeCommand (commandName: string, params: any[]) {
        return Promise.all(this.#commandHandler.map(async c => await c._beforeCmd(commandName, params)))
    }

    async afterCommand (commandName: string) {
        if (commandName === 'switchToWindow') {
            await this.#setupHandler()
        }

        return Promise.all(this.#commandHandler.map(async c => await c._afterCmd(commandName)))
    }

    /**
     * set flag to run performance audits for page transitions
     */
    #enablePerformanceAudits ({ networkThrottling, cpuThrottling, cacheEnabled, formFactor }: EnablePerformanceAuditsOptions = DEFAULT_THROTTLE_STATE) {
        if (!NETWORK_STATES[networkThrottling]) {
            throw new Error(`Network throttling profile "${networkThrottling}" is unknown, choose between ${Object.keys(NETWORK_STATES).join(', ')}`)
        }

        if (typeof cpuThrottling !== 'number') {
            throw new Error(`CPU throttling rate needs to be typeof number but was "${typeof cpuThrottling}"`)
        }

        this.#commandHandler.forEach(
            (c) => c.enablePerformanceAudits({ networkThrottling, cpuThrottling, cacheEnabled, formFactor }))
    }

    /**
     * custom command to disable performance audits
     */
    #disablePerformanceAudits () {
        this.#commandHandler.forEach(c => c.disablePerformanceAudits())
    }

    async #checkPWA (auditsToBeRun?: PWAAudits[]) {
        const results = await Promise.all(this.#commandHandler.map(async c => await c.checkPWA(auditsToBeRun)))
        return this.#commandHandler.length === 1 ? results[0] : results
    }

    async #setupHandler () {
        if (!this.#browser) {
            return
        }

        /**
         * In case of switchToWindow, needs to not add more commands to the array
         */
        this.#commandHandler.length = 0

        /**
         * To avoid if-else, gather all browser instances into an array
         */
        const browsers = Object.keys(this.#browser).includes('sessionId') ?
            [this.#browser] :
            (this.#browser as WebdriverIO.MultiRemoteBrowser).instances.map(i => (this.#browser as WebdriverIO.MultiRemoteBrowser).getInstance(i))

        for (const browser of browsers) {
            const puppeteer = await (browser as WebdriverIO.Browser).getPuppeteer().catch(() => undefined) as any as PuppeteerBrowser
            if (!puppeteer) {
                log.error('Could not initiate Puppeteer instance')
                return setUnsupportedCommand(browser as WebdriverIO.Browser)
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

            const cmd = new CommandHandler(session, page, driver, browser)
            await cmd._initCommand()
            this.#commandHandler.push(cmd)
        }

        this.#browser.addCommand('enablePerformanceAudits', this.#enablePerformanceAudits.bind(this))
        this.#browser.addCommand('disablePerformanceAudits', this.#disablePerformanceAudits.bind(this))
        this.#browser.addCommand('checkPWA', this.#checkPWA.bind(this))
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
        interface Browser extends BrowserExtension { }
        interface MultiRemoteBrowser extends BrowserExtension { }
    }
}
