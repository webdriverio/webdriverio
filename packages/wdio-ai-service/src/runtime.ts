import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { ActCache, cacheFileFor, cacheKey, resolveMode, type EffectiveMode } from './cache.js'
import { ActError } from './errors.js'
import { runLoop } from './loop.js'
import { describeModel, resolveModel, selectModel } from './model.js'
import { actPrompt, replayContext, systemPrompt } from './prompts.js'
import { assertValues } from './redact.js'
import { replaySteps } from './replay.js'
import { pageTools } from './tools.js'
import type { ActOptions, ActResult, ActStep, AiServiceOptions, CacheMode, ModelOption } from './types.js'

const log = logger('@wdio/ai-service')

export const DEFAULT_MAX_STEPS = 15
export const DEFAULT_TIMEOUT = 60_000
export const DEFAULT_WAIT_TIMEOUT = 5_000

export interface RuntimeOptions extends AiServiceOptions {
    /**
     * `updateSnapshots` of the testrunner config
     */
    updateSnapshots?: string
    /**
     * `outputDir` of the testrunner config, updated cache entries land in
     * `<outputDir>/act-cache/` in heal mode
     */
    outputDir?: string
}

interface TestContext {
    spec: string
    title: string
    /**
     * `act` calls in this test so far
     */
    calls: number
}

export type ActScope = WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext

/**
 * the browser that owns a browser, element or browsing context
 */
export function browserOf (scope: ActScope): WebdriverIO.Browser {
    if ('browser' in scope && scope.browser && 'contextId' in scope) {
        return scope.browser as WebdriverIO.Browser
    }
    let current = scope as WebdriverIO.Browser | WebdriverIO.Element
    while ('parent' in current && current.parent) {
        current = current.parent as WebdriverIO.Browser | WebdriverIO.Element
    }
    return current as WebdriverIO.Browser
}

export interface PlanResult {
    steps: ActStep[]
    summary: string
}

/**
 * State shared by every `act` call of a worker: the agent session per
 * browser, the resolved models and the model call budget.
 */
export class AiRuntime {
    readonly options: RuntimeOptions
    #agents = new WeakMap<WebdriverIO.Browser, Promise<AgentSession>>()
    #models = new Map<ModelOption, Promise<BaseChatModel>>()
    #caches = new Map<string, ActCache>()
    #instructions?: Promise<string | undefined>
    #test?: TestContext
    modelCalls = 0

    constructor (options: RuntimeOptions = {}) {
        this.options = options
    }

    /**
     * a test or scenario starts, its `act` calls are counted from 1
     */
    startTest (spec: string, title: string) {
        this.#test = { spec, title, calls: 0 }
    }

    endTest () {
        this.#test = undefined
    }

    mode (override?: CacheMode): EffectiveMode {
        return resolveMode(override ?? this.options.cache, { updateSnapshots: this.options.updateSnapshots })
    }

    #cacheFor (spec: string) {
        const file = cacheFileFor(spec, this.options.cacheDir)
        let cache = this.#caches.get(file)
        if (!cache) {
            cache = new ActCache(file)
            this.#caches.set(file, cache)
        }
        return cache
    }

    /**
     * Write recorded and healed entries. Heal mode leaves the cache files
     * alone and writes to `<outputDir>/act-cache/` instead.
     */
    async flush () {
        const mode = this.mode()
        for (const cache of this.#caches.values()) {
            if (mode === 'heal') {
                const dir = path.join(this.options.outputDir || process.cwd(), 'act-cache')
                await cache.flush(path.join(dir, path.basename(cache.file)))
            } else {
                await cache.flush()
            }
        }
    }

    agentFor (browser: WebdriverIO.Browser): Promise<AgentSession> {
        let agent = this.#agents.get(browser)
        if (!agent) {
            agent = createAgentSession(browser, { name: 'ai' })
            this.#agents.set(browser, agent)
        }
        return agent
    }

    #model (option: ModelOption) {
        let model = this.#models.get(option)
        if (!model) {
            model = resolveModel(option)
            this.#models.set(option, model)
        }
        return model
    }

    #projectInstructions () {
        if (!this.#instructions) {
            const file = this.options.instructions
            this.#instructions = file
                ? fs.readFile(path.resolve(file), 'utf-8').catch((err: Error) => {
                    throw new Error(`[@wdio/ai-service] Cannot read instructions "${file}": ${err.message}`)
                })
                : Promise.resolve(undefined)
        }
        return this.#instructions
    }

    /**
     * Let the model perform an instruction and record the steps it took.
     */
    async plan (agent: AgentSession, instruction: string, options: ActOptions = {}, context?: string): Promise<PlanResult> {
        const modelOption = selectModel(options.model, this.options.model)
        if (!modelOption) {
            throw new ActError({
                instruction,
                reason: 'no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.'
            })
        }
        if (this.options.maxModelCalls !== undefined && this.modelCalls >= this.options.maxModelCalls) {
            throw new ActError({ instruction, reason: `the budget of ${this.options.maxModelCalls} model calls is used up` })
        }

        const values = options.values || {}
        const steps: ActStep[] = []
        const tools = await pageTools({ agent, values, actions: this.options.actions, onStep: (step) => steps.push(step) })
        const maxSteps = options.maxSteps ?? this.options.maxSteps ?? DEFAULT_MAX_STEPS
        log.info(`act("${instruction}") with ${describeModel(modelOption)}`)
        const result = await runLoop({
            model: await this.#model(modelOption),
            tools,
            systemPrompt: systemPrompt(await this.#projectInstructions()),
            prompt: actPrompt(instruction, context),
            maxSteps,
            timeout: options.timeout ?? DEFAULT_TIMEOUT
        })
        this.modelCalls += result.modelCalls
        if (result.status === 'fail') {
            throw new ActError({ instruction, reason: result.summary, steps, usage: result.usage })
        }
        return { steps, summary: result.summary }
    }

    async act (scope: ActScope, instruction: string, options: ActOptions = {}): Promise<ActResult> {
        if (typeof instruction !== 'string' || !instruction.trim()) {
            throw new Error('[@wdio/ai-service] act() needs an instruction')
        }
        assertValues(instruction, options.values)
        const browser = browserOf(scope)
        if ((browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            throw new Error('[@wdio/ai-service] act() runs on one browser. Call it on an instance, e.g. browser.getInstance(\'myBrowser\').act(...)')
        }
        const agent = await this.agentFor(browser)
        const mode = this.mode(options.cache)
        const test = this.#test
        if (test) {
            test.calls++
        }

        /**
         * the cache needs a spec file: the testrunner provides one, a
         * standalone script does not
         */
        const platform = platformOf(agent)
        const key = options.id ?? (test ? cacheKey(test.title, test.calls, platform) : undefined)
        const cache = mode !== 'off' && key && test ? this.#cacheFor(test.spec) : undefined
        const values = options.values || {}
        const entry = cache && key && mode !== 'record' ? await cache.get(key) : undefined

        if (entry && entry.instruction === instruction) {
            const replay = await replaySteps(agent, entry.steps, values, waitTimeoutOf(browser))
            if (!replay.failed) {
                return { source: 'cache', steps: entry.steps.map(({ action, code }) => ({ action, code })) }
            }
            if (mode === 'locked') {
                throw new ActError({
                    instruction,
                    reason: `cached step ${replay.failed.index + 1} (${replay.failed.step.code}) failed and the cache is locked: ${replay.failed.error}`,
                    steps: replay.done
                })
            }
            log.info(`act("${instruction}"): cached step ${replay.failed.index + 1} failed, asking the model to continue`)
            const rest = await this.plan(agent, instruction, options, replayContext(replay.done, replay.failed))
            const steps = [...replay.done, ...rest.steps]
            this.#store(cache!, key!, { instruction, platform, steps }, options)
            return { source: 'model', healed: 'model', steps: steps.map(({ action, code }) => ({ action, code })), summary: rest.summary }
        }

        if (mode === 'locked') {
            throw new ActError({ instruction, reason: `no cached steps for "${key}" and the cache is locked` })
        }
        const { steps, summary } = await this.plan(agent, instruction, options)
        if (cache && key) {
            this.#store(cache, key, { instruction, platform, steps }, options)
        }
        return { source: 'model', steps: steps.map(({ action, code }) => ({ action, code })), summary }
    }

    #store (cache: ActCache, key: string, entry: { instruction: string, platform: string, steps: ActStep[] }, options: ActOptions) {
        const model = selectModel(options.model, this.options.model)
        cache.set(key, {
            ...entry,
            ...(model ? { model: describeModel(model) } : {}),
            recordedAt: new Date().toISOString()
        })
    }
}

/**
 * `web` for a page, otherwise the label of the mobile or desktop platform
 */
function platformOf (agent: AgentSession) {
    const plan = agent.session.plan
    return plan.applies.includes('W') && plan.platform === 'browser' ? 'web' : plan.label
}

function waitTimeoutOf (browser: WebdriverIO.Browser) {
    return browser.options?.waitforTimeout ?? DEFAULT_WAIT_TIMEOUT
}
