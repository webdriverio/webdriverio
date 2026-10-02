import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { ActCache, cacheFileFor, cacheKey, resolveMode, type EffectiveMode } from './cache.js'
import { ActError, type TokenUsage } from './errors.js'
import { runLoop } from './loop.js'
import { describeModel, resolveModel, selectModel } from './model.js'
import { actPrompt, replayContext, SCOPE_PROMPT, systemPrompt, WORKSPACE_PROMPT } from './prompts.js'
import { assertValues } from './redact.js'
import { replaySteps, type EffectCheck, type HealedStep } from './replay.js'
import { describeEffect, isEmpty, mergeEffects, missingEffects, observableWithoutBidi, resolveEffectsConfig, type EffectsConfig } from './effects.js'
import { EffectRecorder } from './recorder.js'
import { emitRecord, writeRecords, type ActRecord } from './stats.js'
import { pageTools } from './tools.js'
import { slug, Workspace, type KeepPolicy } from './workspace.js'
import { capturesHealEvidence, HealEvidence } from './evidence.js'
import type { StandardSchemaV1 } from '@standard-schema/spec'

import { answerTools, EXTRACT_PROMPT, jsonSchemaOf, READ_ACTIONS, RESPONSES_PROMPT, validate, type ExtractOutcome } from './extract.js'
import { ResponseLog } from './responses.js'
import { contextTree } from './contexts.js'
import type { ActOptions, ActResult, ActStep, AiServiceOptions, CacheMode, ExtractOptions, ModelOption } from './types.js'

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
    /**
     * when the test started, `extract` only sees API responses from then on
     */
    startedAt: number
    /**
     * created on the first model call of the test
     */
    workspace?: Workspace
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

function isBrowsingContext (scope: ActScope): scope is WebdriverIO.BrowsingContext {
    return 'contextId' in scope && 'browser' in scope
}

function isElement (scope: ActScope): scope is WebdriverIO.Element {
    return !isBrowsingContext(scope) && ('elementId' in scope || 'selector' in scope) && 'parent' in scope
}

interface Scope {
    /**
     * ref of the element the call is limited to
     */
    ref?: string
    /**
     * go back to the context before, for a call on a held tab or frame
     */
    leave?: () => Promise<void>
}

/**
 * An element call is limited to the element. A call on a held tab, window
 * or frame runs in that context and goes back afterwards.
 */
async function scopeOf (agent: AgentSession, scope: ActScope): Promise<Scope> {
    if (isBrowsingContext(scope)) {
        return { leave: await agent.enter(scope) }
    }
    if (isElement(scope)) {
        return { ref: await agent.pin(scope) }
    }
    return {}
}

export interface PlanResult {
    steps: ActStep[]
    summary: string
    usage: TokenUsage
}

interface ActOutcome {
    result: ActResult
    usage: TokenUsage
    healedSteps?: HealedStep[]
}

export type EffectsCoverage = 'checked' | 'partial' | 'off'

const NO_USAGE: TokenUsage = { input: 0, output: 0 }

/**
 * State shared by every `act` call of a worker: the agent session per
 * browser, the resolved models and the model call budget.
 */
export class AiRuntime {
    readonly options: RuntimeOptions
    #agents = new WeakMap<WebdriverIO.Browser, Promise<AgentSession>>()
    #recorders = new WeakMap<WebdriverIO.Browser, Promise<EffectRecorder | undefined>>()
    #responses = new WeakMap<WebdriverIO.Browser, Promise<ResponseLog | undefined>>()
    readonly effects: EffectsConfig
    #models = new Map<ModelOption, Promise<BaseChatModel>>()
    #caches = new Map<string, ActCache>()
    #instructions?: Promise<string | undefined>
    #test?: TestContext
    modelCalls = 0
    /**
     * one record per `act` call, written for the end-of-run summary
     */
    readonly records: ActRecord[] = []

    constructor (options: RuntimeOptions = {}) {
        this.options = options
        this.effects = resolveEffectsConfig(options.effects)
    }

    /**
     * a test or scenario starts, its `act` calls are counted from 1
     */
    startTest (spec: string, title: string) {
        this.#test = { spec, title, calls: 0, startedAt: Date.now() }
    }

    /**
     * the test ended, its workspace is kept on failure or heal (by default)
     */
    async endTest (passed = true) {
        const test = this.#test
        this.#test = undefined
        await test?.workspace?.finish(this.#keepPolicy, passed)
    }

    get #keepPolicy (): KeepPolicy {
        return this.options.workspace?.keep ?? 'on-failure'
    }

    get #workspaceRoot () {
        return this.options.workspace?.dir
            ? path.resolve(this.options.workspace.dir)
            : path.join(outputDirOf(this.options), 'ai')
    }

    /**
     * the workspace of the current test, or one for a standalone call
     */
    #workspaceFor (instruction: string) {
        const test = this.#test
        if (!test) {
            return new Workspace(this.#workspaceRoot, 'standalone', instruction)
        }
        test.workspace ??= new Workspace(this.#workspaceRoot, test.spec, test.title)
        return test.workspace
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
        await writeRecords(this.records.splice(0))
        const mode = this.mode()
        for (const cache of this.#caches.values()) {
            if (mode === 'heal') {
                const dir = path.join(outputDirOf(this.options), 'act-cache')
                await cache.flush(path.join(dir, path.basename(cache.file)))
            } else {
                await cache.flush()
            }
        }
    }

    agentFor (browser: WebdriverIO.Browser): Promise<AgentSession> {
        let agent = this.#agents.get(browser)
        if (!agent) {
            agent = createAgentSession(browser, { name: 'ai', captureEvents: true })
            this.#agents.set(browser, agent)
            this.#recorders.set(browser, agent.then((session) => this.#attachRecorder(browser, session)))
            this.#responses.set(browser, agent.then((session) => this.#attachResponses(browser, session)))
        }
        return agent
    }

    async #attachResponses (browser: WebdriverIO.Browser, agent: AgentSession) {
        if (this.options.responseBodies === false || agent.session.plan.platform !== 'browser') {
            return undefined
        }
        return ResponseLog.attach(browser, this.effects.ignore)
    }

    /**
     * Effects are recorded on web pages. Native apps have no network or DOM
     * events to watch, their effects are not checked.
     */
    async #attachRecorder (browser: WebdriverIO.Browser, agent: AgentSession) {
        if (this.effects.mode === 'off' || !agent.session.plan.applies.includes('W') || agent.session.plan.platform !== 'browser') {
            return undefined
        }
        return EffectRecorder.attach(browser, this.effects)
    }

    async recorderFor (browser: WebdriverIO.Browser) {
        await this.agentFor(browser)
        return this.#recorders.get(browser)
    }

    #coverage (recorder?: EffectRecorder): EffectsCoverage {
        if (this.effects.mode === 'off') {
            return 'off'
        }
        return recorder?.bidi ? 'checked' : 'partial'
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
    async plan (agent: AgentSession, instruction: string, options: ActOptions = {}, context?: string, scope?: string, recorder?: EffectRecorder): Promise<PlanResult> {
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
        const workspace = this.#workspaceFor(instruction)
        workspace.values = values
        await workspace.writeEvents(agent.logs, agent.network)
        const tools = await pageTools({ agent, values, actions: this.options.actions, onStep: (step) => steps.push(step), workspace, scope, effects: recorder })
        const maxSteps = options.maxSteps ?? this.options.maxSteps ?? DEFAULT_MAX_STEPS
        log.info(`act("${instruction}") with ${describeModel(modelOption)}`)
        try {
            const result = await runLoop({
                model: await this.#model(modelOption),
                tools,
                systemPrompt: systemPrompt(await this.#projectInstructions(), true),
                prompt: actPrompt(instruction, context, Boolean(scope)),
                maxSteps,
                timeout: options.timeout ?? DEFAULT_TIMEOUT,
                middleware: [await workspace.middleware()]
            })
            this.modelCalls += result.modelCalls
            if (result.status === 'fail') {
                workspace.keep = true
                throw new ActError({ instruction, reason: result.summary, steps, usage: result.usage, workspace: workspace.dir })
            }
            return { steps, summary: result.summary, usage: result.usage }
        } finally {
            await workspace.writeEvents(agent.logs, agent.network)
            await workspace.writeSteps(steps)
            if (!this.#test) {
                await workspace.finish(this.#keepPolicy, !workspace.keep)
            }
        }
    }

    async act (scope: ActScope, instruction: string, options: ActOptions = {}): Promise<ActResult> {
        const started = Date.now()
        const test = this.#test
        const base = { ...(test ? { spec: test.spec, test: test.title } : {}), instruction }
        const evidence = this.#evidenceFor(scope, instruction)
        const artifacts = async () => {
            const files = await evidence?.end() ?? []
            return files.length ? { artifacts: files } : {}
        }
        try {
            const { result, usage, healedSteps } = await this.#act(scope, instruction, options, evidence)
            this.#record({
                ...base,
                ...await artifacts(),
                effects: this.#coverage(await this.recorderFor(browserOf(scope)).catch(() => undefined)),
                source: result.source,
                ...(result.healed ? { healed: result.healed } : {}),
                ...(healedSteps?.length ? { healedSteps } : {}),
                usage,
                durationMs: Date.now() - started
            })
            return result
        } catch (err) {
            this.#record({
                ...base,
                ...await artifacts(),
                source: 'model',
                error: (err as Error).message,
                usage: err instanceof ActError && err.usage ? err.usage : NO_USAGE,
                durationMs: Date.now() - started
            })
            throw err
        }
    }

    /**
     * where the screenshots and video of a heal go, captured only once a
     * cached step fails
     */
    #evidenceFor (scope: ActScope, instruction: string) {
        const browser = browserOf(scope)
        if (!capturesHealEvidence(this.options) || (browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            return undefined
        }
        const test = this.#test
        const name = test ? `${path.basename(test.spec)}-${test.title}` : instruction
        return new HealEvidence(browser, path.join(this.#workspaceRoot, 'heals', `${slug(name)}-${crypto.randomUUID().slice(0, 8)}`))
    }

    #record (record: ActRecord) {
        this.records.push(record)
        emitRecord(record)
        if (record.healed === 'cache') {
            for (const step of record.healedSteps || []) {
                log.warn(`act("${record.instruction}") healed step ${step.index + 1} without the model: ${step.from} → ${step.to}`)
            }
        } else if (record.healed === 'model') {
            log.warn(`act("${record.instruction}") was continued by the model after a cached step failed`)
        }
    }

    async #act (scope: ActScope, instruction: string, options: ActOptions, evidence?: HealEvidence): Promise<ActOutcome> {
        if (typeof instruction !== 'string' || !instruction.trim()) {
            throw new Error('[@wdio/ai-service] act() needs an instruction')
        }
        assertValues(instruction, options.values)
        const browser = browserOf(scope)
        if ((browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            throw new Error('[@wdio/ai-service] act() runs on one browser. Call it on an instance, e.g. browser.getInstance(\'myBrowser\').act(...)')
        }
        const agent = await this.agentFor(browser)
        const recorder = await this.#recorders.get(browser)
        const scoped = await scopeOf(agent, scope)
        try {
            return await this.#actIn(agent, browser, instruction, options, scoped.ref, recorder, evidence)
        } finally {
            await scoped.leave?.()
        }
    }

    async #actIn (agent: AgentSession, browser: WebdriverIO.Browser, instruction: string, options: ActOptions, scopeRef: string | undefined, recorder?: EffectRecorder, evidence?: HealEvidence): Promise<ActOutcome> {
        const effects: EffectCheck | undefined = recorder ? { recorder, mode: this.effects.mode } : undefined
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
        const summarize = (steps: ActStep[]) => steps.map(({ action, code }) => ({ action, code }))

        if (entry && entry.instruction === instruction) {
            const replay = await replaySteps(agent, entry.steps, values, waitTimeoutOf(browser), effects, evidence)
            if (!replay.failed) {
                if (replay.healed.length) {
                    if (mode !== 'locked') {
                        this.#store(cache!, key!, { instruction, platform, steps: replay.done }, options, entry.model)
                    }
                    return { result: { source: 'cache', healed: 'cache', steps: summarize(replay.done) }, usage: NO_USAGE, healedSteps: replay.healed }
                }
                return { result: { source: 'cache', steps: summarize(entry.steps) }, usage: NO_USAGE }
            }
            const failed = replay.failed
            /**
             * A step that ran but did something else is not handed to the
             * model in any mode: the model would run it again to cause the
             * recorded effect, e.g. submit a payment twice.
             */
            if (failed.kind === 'timeout') {
                throw new ActError({
                    instruction,
                    reason: `cached step ${failed.index + 1} (${failed.step.code}) ran, but ${failed.error}. Raise \`waitforTimeout\` if the app is that slow.`,
                    steps: replay.done
                })
            }
            if (failed.kind === 'effect') {
                throw new ActError({
                    instruction,
                    reason: failed.healedWith
                        ? `cached step ${failed.index + 1} (${failed.step.code}) no longer finds its element, and ${failed.error}. The app may have changed behavior, not just markup.`
                        : `cached step ${failed.index + 1} (${failed.step.code}) ran, but ${failed.error}. The app may have changed behavior, not just markup.`,
                    steps: replay.done
                })
            }
            if (mode === 'locked') {
                throw new ActError({
                    instruction,
                    reason: `cached step ${failed.index + 1} (${failed.step.code}) failed and the cache is locked: ${failed.error}`,
                    steps: replay.done
                })
            }
            log.info(`act("${instruction}"): cached step ${replay.failed.index + 1} failed, asking the model to continue`)
            const rest = await this.plan(agent, instruction, options, replayContext(replay.done, replay.failed), scopeRef, recorder)
            await evidence?.after()
            /**
             * the model's steps have to do what the failed step did
             */
            const expected = recorder?.bidi ? replay.failed.step.effect : observableWithoutBidi(replay.failed.step.effect)
            const missing = effects && !isEmpty(expected) ? missingEffects(expected, mergeEffects(rest.steps.map((step) => step.effect)), effects.mode) : []
            if (missing.length) {
                throw new ActError({
                    instruction,
                    reason: `the app changed behavior: step ${replay.failed.index + 1} (${replay.failed.step.code}) caused ${describeEffect(expected!)} when it was recorded, and the steps the model took now do not cause ${missing.join(', ')}`,
                    steps: [...replay.done, ...rest.steps],
                    usage: rest.usage,
                    workspace: test?.workspace?.dir
                })
            }
            if (test?.workspace) {
                test.workspace.keep = true
            }
            const steps = [...replay.done, ...rest.steps]
            this.#store(cache!, key!, { instruction, platform, steps }, options)
            return { result: { source: 'model', healed: 'model', steps: summarize(steps), summary: rest.summary }, usage: rest.usage, healedSteps: replay.healed }
        }

        if (mode === 'locked') {
            throw new ActError({ instruction, reason: `no cached steps for "${key}" and the cache is locked` })
        }
        const { steps, summary, usage } = await this.plan(agent, instruction, options, undefined, scopeRef, recorder)
        if (cache && key) {
            this.#store(cache, key, { instruction, platform, steps }, options)
        }
        return { result: { source: 'model', steps: summarize(steps), summary }, usage }
    }

    /**
     * Read typed data from the page. Never cached: a read has to see the
     * current page.
     */
    async extract<T> (scope: ActScope, instruction: string, schema: StandardSchemaV1<unknown, T>, options: ExtractOptions = {}): Promise<T> {
        if (typeof instruction !== 'string' || !instruction.trim()) {
            throw new Error('[@wdio/ai-service] extract() needs an instruction')
        }
        if (!schema || typeof schema !== 'object' || typeof (schema as StandardSchemaV1)['~standard']?.validate !== 'function') {
            throw new Error('[@wdio/ai-service] extract() needs a Standard Schema, e.g. a zod, valibot or arktype schema')
        }
        assertValues(instruction, options.values)
        const started = Date.now()
        const test = this.#test
        const base = { kind: 'extract' as const, ...(test ? { spec: test.spec, test: test.title } : {}), instruction, source: 'model' as const }
        const usage = { input: 0, output: 0 }
        try {
            const { value, evidence } = await this.#extract(scope, instruction, schema, options, usage)
            this.#record({ ...base, ...(evidence?.length ? { evidence } : {}), usage, durationMs: Date.now() - started })
            return value
        } catch (err) {
            this.#record({ ...base, error: (err as Error).message, usage, durationMs: Date.now() - started })
            throw err
        }
    }

    async #extract<T> (scope: ActScope, instruction: string, schema: StandardSchemaV1<unknown, T>, options: ExtractOptions, usage: TokenUsage) {
        const browser = browserOf(scope)
        if ((browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            throw new Error('[@wdio/ai-service] extract() runs on one browser. Call it on an instance, e.g. browser.getInstance(\'myBrowser\').extract(...)')
        }
        const modelOption = selectModel(options.model, this.options.model)
        if (!modelOption) {
            throw new ActError({ instruction, reason: 'no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.' })
        }
        const agent = await this.agentFor(browser)
        const scoped = await scopeOf(agent, scope)
        try {
            return await this.#extractIn(agent, instruction, schema, options, usage, scoped.ref)
        } finally {
            await scoped.leave?.()
        }
    }

    async #extractIn<T> (agent: AgentSession, instruction: string, schema: StandardSchemaV1<unknown, T>, options: ExtractOptions, usage: TokenUsage, scopeRef?: string) {
        const modelOption = selectModel(options.model, this.options.model)!
        const values = options.values || {}
        const workspace = this.#workspaceFor(instruction)
        workspace.values = values
        await workspace.writeEvents(agent.logs, agent.network)
        const responses = await this.#responses.get(agent.browser)?.catch(() => undefined)
        const withResponses = responses ? await workspace.writeResponses(responses, responses.select({
            contexts: await contextTree(agent.browser, await agent.browser.getWindowHandle().catch(() => undefined)),
            since: this.#test?.startedAt
        })) > 0 : false
        const jsonSchema = jsonSchemaOf(schema)
        const tools = await pageTools({ agent, values, actions: READ_ACTIONS, onStep: () => {}, workspace, scope: scopeRef })
        let feedback = ''
        try {
            for (let attempt = 1; attempt <= 2; attempt++) {
                const outcome: ExtractOutcome = {}
                const result = await runLoop({
                    model: await this.#model(modelOption),
                    tools,
                    systemPrompt: [EXTRACT_PROMPT, WORKSPACE_PROMPT, ...(withResponses ? [RESPONSES_PROMPT] : [])].join('\n\n'),
                    prompt: [
                        `Instruction: ${instruction}`,
                        scopeRef ? SCOPE_PROMPT : '',
                        jsonSchema ? `The value has to match this JSON Schema:\n${JSON.stringify(jsonSchema)}` : '',
                        feedback
                    ].filter(Boolean).join('\n\n'),
                    maxSteps: options.maxSteps ?? this.options.maxSteps ?? DEFAULT_MAX_STEPS,
                    timeout: options.timeout ?? DEFAULT_TIMEOUT,
                    middleware: [await workspace.middleware()],
                    control: { outcome, tools: await answerTools(outcome, jsonSchema) }
                })
                this.modelCalls += result.modelCalls
                usage.input += result.usage.input
                usage.output += result.usage.output
                if (result.status === 'fail' || outcome.status !== 'done') {
                    workspace.keep = true
                    throw new ActError({ instruction, reason: result.summary, usage, workspace: workspace.dir })
                }
                const checked = await validate(schema, outcome.value)
                if ('value' in checked) {
                    return { value: checked.value, evidence: outcome.evidence }
                }
                feedback = `Your previous answer ${JSON.stringify(outcome.value)} did not match the schema: ${checked.issues}. Answer again.`
            }
            workspace.keep = true
            throw new ActError({ instruction, reason: `the answer did not match the schema. ${feedback}`, usage, workspace: workspace.dir })
        } finally {
            if (!this.#test) {
                await workspace.finish(this.#keepPolicy, !workspace.keep)
            }
        }
    }

    #store (cache: ActCache, key: string, entry: { instruction: string, platform: string, steps: ActStep[] }, options: ActOptions, recordedBy?: string) {
        const model = selectModel(options.model, this.options.model)
        const modelName = recordedBy ?? (model ? describeModel(model) : undefined)
        cache.set(key, {
            ...entry,
            ...(modelName ? { model: modelName } : {}),
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

/**
 * `outputDir` of the config, or `.wdio` in the project like `wdio session`
 */
export function outputDirOf (options: { outputDir?: string }) {
    return options.outputDir ? path.resolve(options.outputDir) : path.join(process.cwd(), '.wdio')
}
