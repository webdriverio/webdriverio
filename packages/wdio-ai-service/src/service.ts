import type { Services } from '@wdio/types'

import { AiRuntime } from './runtime.js'
import type { ActOptions, AiServiceOptions } from './types.js'

/**
 * Register `act` on a browser, its elements and its browsing contexts.
 */
export function registerCommands (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, runtime: AiRuntime) {
    const act = function (this: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext, instruction: string, options?: ActOptions) {
        return runtime.act(this, instruction, options)
    }
    /**
     * a multi-remote browser forwards the commands to its instances
     */
    const target = browser as WebdriverIO.Browser
    target.addCommand('act', act)
    target.addCommand('act', act, { attachToElement: true })
    target.addCommand('act', act, { attachToBrowsingContext: true })
}

/**
 * `services: [['ai', { model: 'anthropic:claude-sonnet-5-5' }]]`
 */
export default class AiService implements Services.ServiceInstance {
    readonly runtime: AiRuntime

    constructor (options: AiServiceOptions = {}) {
        this.runtime = new AiRuntime(options)
    }

    before (_capabilities: unknown, _specs: string[], browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
        registerCommands(browser, this.runtime)
    }
}
