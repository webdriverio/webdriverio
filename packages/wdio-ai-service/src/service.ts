import type { Services } from '@wdio/types'
import { specFilePath } from '@wdio/utils'

import { AiRuntime, parallelContextOf } from './runtime.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'

import type { ActOptions, AiServiceOptions, ExtractOptions } from './types.js'

/**
 * Register `act` and `extract` on a browser, its elements and its browsing contexts.
 */
export function registerCommands (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, runtime: AiRuntime) {
    const act = function (this: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext, instruction: string, options?: ActOptions) {
        return runtime.act(this, instruction, options)
    }
    /**
     * a multi-remote browser forwards the commands to its instances
     */
    const target = browser as WebdriverIO.Browser
    const extract = function (this: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext, instruction: string, schema: StandardSchemaV1, options?: ExtractOptions) {
        return runtime.extract(this, instruction, schema, options)
    }
    target.addCommand('act', act)
    target.addCommand('act', act, { attachToElement: true })
    target.addCommand('act', act, { attachToBrowsingContext: true })
    target.addCommand('extract', extract)
    target.addCommand('extract', extract, { attachToElement: true })
    target.addCommand('extract', extract, { attachToBrowsingContext: true })
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
    #browser?: WebdriverIO.Browser

    constructor (options: AiServiceOptions = {}, _capabilities?: unknown, config: Partial<WebdriverIO.Config> = {}) {
        this.runtime = new AiRuntime({
            ...options,
            updateSnapshots: config.updateSnapshots,
            outputDir: config.outputDir
        })
    }

    async before (_capabilities: unknown, specs: string[], browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
        this.#specs = specs
        registerCommands(browser, this.runtime)
        /**
         * start capturing console and network events with the session, so
         * the workspace has what happened before the first `act` call
         */
        const instances = (browser as WebdriverIO.MultiRemoteBrowser).isMultiRemote
            ? (browser as WebdriverIO.MultiRemoteBrowser).instances.map((name) => (browser as WebdriverIO.MultiRemoteBrowser).getInstance(name))
            : [browser as WebdriverIO.Browser]
        this.#browser = instances[0]
        await Promise.all(instances.map((instance) => this.runtime.agentFor(instance)))
    }

    /**
     * Mocha and Jasmine
     */
    beforeTest (test: TestLike) {
        this.runtime.startTest(...this.#testOf(test))
    }

    async afterTest (test: TestLike, _context: unknown, result?: { passed?: boolean }) {
        await this.runtime.endTest(result?.passed ?? true, ...this.#testOf(test))
    }

    #testOf (test: TestLike): [spec: string, title: string, contextId?: string] {
        return [specFilePath(test.file || this.#specs[0] || 'spec'), test.fullTitle || test.fullName || test.title || test.description || 'test', parallelContextOf(this.#browser)]
    }

    /**
     * Cucumber
     */
    beforeScenario (world: CucumberWorld) {
        this.runtime.startTest(...this.#scenarioOf(world))
    }

    async afterScenario (world: CucumberWorld, result?: { passed?: boolean }) {
        await this.runtime.endTest(result?.passed ?? true, ...this.#scenarioOf(world))
    }

    #scenarioOf (world: CucumberWorld): [spec: string, title: string, contextId?: string] {
        return [specFilePath(world.pickle?.uri || this.#specs[0] || 'spec'), world.pickle?.name || 'scenario', parallelContextOf(this.#browser)]
    }

    async after () {
        await this.runtime.flush()
    }
}
