import url from 'node:url'

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

interface TestLike {
    file?: string
    fullTitle?: string
    fullName?: string
    title?: string
    description?: string
}

interface CucumberWorld {
    pickle?: { uri?: string, name?: string }
}

/**
 * `services: [['ai', { model: 'anthropic:claude-sonnet-5-5' }]]`
 */
export default class AiService implements Services.ServiceInstance {
    readonly runtime: AiRuntime
    #specs: string[] = []

    constructor (options: AiServiceOptions = {}, _capabilities?: unknown, config: Partial<WebdriverIO.Config> = {}) {
        this.runtime = new AiRuntime({
            ...options,
            updateSnapshots: config.updateSnapshots,
            outputDir: config.outputDir
        })
    }

    before (_capabilities: unknown, specs: string[], browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
        this.#specs = specs
        registerCommands(browser, this.runtime)
    }

    /**
     * Mocha and Jasmine
     */
    beforeTest (test: TestLike) {
        const title = test.fullTitle || test.fullName || test.title || test.description || 'test'
        this.runtime.startTest(specPath(test.file || this.#specs[0]), title)
    }

    afterTest () {
        this.runtime.endTest()
    }

    /**
     * Cucumber
     */
    beforeScenario (world: CucumberWorld) {
        this.runtime.startTest(specPath(world.pickle?.uri || this.#specs[0]), world.pickle?.name || 'scenario')
    }

    afterScenario () {
        this.runtime.endTest()
    }

    async after () {
        await this.runtime.flush()
    }
}

/**
 * spec paths arrive as file URLs from the runner
 */
function specPath (spec = 'spec') {
    return spec.startsWith('file://') ? url.fileURLToPath(spec) : spec
}
