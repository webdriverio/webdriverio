import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { ActError } from './errors.js'
import { runLoop } from './loop.js'
import { describeModel, resolveModel, selectModel } from './model.js'
import { actPrompt, systemPrompt } from './prompts.js'
import { assertValues } from './redact.js'
import { pageTools } from './tools.js'
import type { ActOptions, ActResult, ActStep, AiServiceOptions, ModelOption } from './types.js'

const log = logger('@wdio/ai-service')

export const DEFAULT_MAX_STEPS = 15
export const DEFAULT_TIMEOUT = 60_000

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
    readonly options: AiServiceOptions
    #agents = new WeakMap<WebdriverIO.Browser, Promise<AgentSession>>()
    #models = new Map<ModelOption, Promise<BaseChatModel>>()
    #instructions?: Promise<string | undefined>
    modelCalls = 0

    constructor (options: AiServiceOptions = {}) {
        this.options = options
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
        const { steps, summary } = await this.plan(agent, instruction, options)
        return { source: 'model', steps: steps.map(({ action, code }) => ({ action, code })), summary }
    }
}
