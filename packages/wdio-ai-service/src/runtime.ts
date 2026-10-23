import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgentSession, type AgentSession } from '@wdio/session/agent'

import { ActCache, cacheFileFor, cacheKey, healFileFor, resolveMode, type EffectiveMode } from './cache.js'
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
import { StepGate, TestEndedError } from './stop.js'
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
    /**
     * aborts when the test ends: a call still running then stops
     */
    controller: AbortController
    /**
     * set when the test ended, a call that stops later finishes the workspace again
     */
    passed?: boolean
    /**
     * browsing context of the test in parallel mode
     */
    contextId?: string
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

/**
 * The browsing context of the running test in parallel mode (`parallelMode`
 * of Mocha or Cucumber), from the store the framework adapters also use.
 */
export function parallelContextOf (browser?: WebdriverIO.Browser): string | undefined {
    return (browser as unknown as { __parallelContextStore?: { getStore (): string | undefined } } | undefined)?.__parallelContextStore?.getStore()
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
    /**
     * the last call per browser, the next one waits until it ended
     */
    #calls = new WeakMap<WebdriverIO.Browser, Promise<unknown>>()
    readonly effects: EffectsConfig
    #models = new Map<ModelOption, Promise<BaseChatModel>>()
    #caches = new Map<string, ActCache>()
    #instructions?: Promise<string | undefined>
    #test?: TestContext
    /**
     * tests that started and did not end, more than one in parallel mode
     */
    #openTests: TestContext[] = []
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
    startTest (spec: string, title: string, contextId?: string) {
        this.#test = { spec, title, calls: 0, startedAt: Date.now(), controller: new AbortController(), contextId }
        this.#openTests.push(this.#test)
    }

    /**
     * The test ended, its workspace is kept on failure or heal (by default).
     * A call of the test that still runs, e.g. after the timeout of the test
     * framework, stops before its next step. `contextId`, or else `spec` and
     * `title`, name the test: in parallel mode, the current test can be another one.
     */
    async endTest (passed = true, spec?: string, title?: string, contextId?: string) {
        const test = contextId !== undefined
            ? this.#openTests.findLast((open) => open.contextId === contextId)
            : title === undefined
                ? this.#test
                : this.#openTests.findLast((open) => open.spec === spec && open.title === title)
                    ?? (this.#openTests.length === 1 ? this.#openTests[0] : undefined)
        if (!test) {
            return
        }
        this.#openTests = this.#openTests.filter((open) => open !== test)
        if (this.#test === test) {
            this.#test = undefined
        }
        test.passed = passed
        test.controller.abort(new TestEndedError(test.title))
        await test.workspace?.finish(this.#keepPolicy, passed)
    }

    /**
     * The test of a call: in parallel mode the test of the caller's browsing
     * context, not the test that started last.
     */
    #testOf (browser: WebdriverIO.Browser) {
        const contextId = parallelContextOf(browser)
        return contextId === undefined
            ? this.#test
            : this.#openTests.findLast((open) => open.contextId === contextId)
    }

    /**
     * One call at a time per browser: two calls on one page would click
     * between each other's steps and share the recorded effect.
     */
    #oneAtATime<T> (browser: WebdriverIO.Browser, call: () => Promise<T>): Promise<T> {
        const result = (this.#calls.get(browser) ?? Promise.resolve()).then(call)
        this.#calls.set(browser, result.then(() => {}, () => {}))
        return result
    }

    /**
     * A call whose test ended stopped after its last action finished. The
     * next test starts on the top document, not in a frame of the old page.
     */
    async #stopped (agent: AgentSession, call: string, signal: AbortSignal) {
        log.warn(`${call} stopped: ${(signal.reason as Error).message}`)
        if (platformOf(agent) === 'web') {
            await agent.runAction('frame', { target: 'top' }).catch(() => {})
        }
    }

    /**
     * A standalone call finishes its workspace itself. So does a call that
     * stopped after its test ended, as it wrote to the workspace after that.
     */
    async #finishCall (workspace: Workspace, test?: TestContext) {
        if (!test) {
            await workspace.finish(this.#keepPolicy, !workspace.keep)
        } else if (test.passed !== undefined) {
            await workspace.finish(this.#keepPolicy, test.passed)
        }
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
     * the workspace of the test of a call, or one for a standalone call
     */
    #workspaceFor (instruction: string, test?: TestContext) {
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
        for (const cache of this.#caches.values()) {
            await cache.flush(healFileFor(cache.file, outputDirOf(this.options)))
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
    async plan (agent: AgentSession, instruction: string, options: ActOptions = {}, context?: string, scope?: string, recorder?: EffectRecorder, test?: TestContext): Promise<PlanResult> {
        const modelOption = selectModel(options.model, this.options.model)
        if (!modelOption) {
            throw new ActError({
                instruction,
                reason: 'no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.'
            })
        }
        this.#assertBudget(instruction)

        const values = options.values || {}
        const steps: ActStep[] = []
        const workspace = this.#workspaceFor(instruction, test)
        workspace.values = values
        workspace.secrets = this.#rememberSecrets(values)
        await workspace.writeEvents(agent.logs, agent.network)
        const gate = new StepGate(test?.controller.signal)
        const tools = await pageTools({ agent, values, secrets: workspace.secrets, actions: this.options.actions, onStep: (step) => steps.push(step), workspace, scope, effects: recorder, gate })
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
                signal: gate.loopSignal,
                middleware: [await workspace.middleware()]
            })
            this.modelCalls += result.modelCalls
            if (result.status !== 'done') {
                workspace.keep = true
                throw new ActError({ instruction, reason: result.summary, steps, usage: result.usage, workspace: workspace.dir })
            }
            return { steps, summary: result.summary, usage: result.usage }
        } finally {
            await workspace.writeEvents(agent.logs, agent.network)
            await workspace.writeSteps(steps)
            await this.#finishCall(workspace, test)
        }
    }

    async act (scope: ActScope, instruction: string, options: ActOptions = {}): Promise<ActResult> {
        const started = Date.now()
        const test = this.#testOf(browserOf(scope))
        const signal = test?.controller.signal
        const base = { ...(test ? { spec: test.spec, test: test.title } : {}), instruction }
        const evidence = this.#evidenceFor(scope, instruction, test)
        const artifacts = async () => {
            const files = await evidence?.end() ?? []
            return files.length ? { artifacts: files } : {}
        }
        try {
            const { result, usage, healedSteps } = await this.#oneAtATime(browserOf(scope), () => this.#act(scope, instruction, options, evidence, test))
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
            const error = signal?.aborted ? stoppedError(instruction, signal, err) : err as Error
            this.#record({
                ...base,
                ...await artifacts(),
                source: 'model',
                error: error.message,
                usage: error instanceof ActError && error.usage ? error.usage : NO_USAGE,
                durationMs: Date.now() - started
            })
            throw error
        }
    }

    /**
     * where the screenshots and video of a heal go, captured only once a
     * cached step fails
     */
    #evidenceFor (scope: ActScope, instruction: string, test?: TestContext) {
        const browser = browserOf(scope)
        if (!capturesHealEvidence(this.options) || (browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            return undefined
        }
        const name = test ? `${path.basename(test.spec)}-${test.title}` : instruction
        return new HealEvidence(browser, path.join(this.#workspaceRoot, 'heals', `${slug(name)}-${crypto.randomUUID().slice(0, 8)}`))
    }

    /**
     * fail before a model call once the worker used up `maxModelCalls`
     */
    #assertBudget (instruction: string, usage?: TokenUsage) {
        if (this.options.maxModelCalls !== undefined && this.modelCalls >= this.options.maxModelCalls) {
            throw new ActError({ instruction, reason: `the budget of ${this.options.maxModelCalls} model calls is used up`, ...(usage ? { usage } : {}) })
        }
    }

    /**
     * every placeholder value of the worker, by value
     */
    #secrets = new Map<string, string>()

    /**
     * Remember the values of a call. Browser events are kept for the whole
     * session, so a value of an earlier call can show up in the events of a
     * later one and has to stay hidden.
     */
    #rememberSecrets (values: Record<string, string>): [string, string][] {
        for (const [name, value] of Object.entries(values)) {
            if (typeof value === 'string' && value) {
                this.#secrets.set(value, name)
            }
        }
        return [...this.#secrets].map(([value, name]) => [name, value])
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

    /**
     * The call belongs to `test`, the test that started it, even when the
     * next test started while it ran.
     */
    async #act (scope: ActScope, instruction: string, options: ActOptions, evidence?: HealEvidence, test?: TestContext): Promise<ActOutcome> {
        if (typeof instruction !== 'string' || !instruction.trim()) {
            throw new Error('[@wdio/ai-service] act() needs an instruction')
        }
        assertValues(instruction, options.values)
        const browser = browserOf(scope)
        if ((browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            throw new Error('[@wdio/ai-service] act() runs on one browser. Call it on an instance, e.g. browser.getInstance(\'myBrowser\').act(...)')
        }
        const signal = test?.controller.signal
        signal?.throwIfAborted()
        const agent = await this.agentFor(browser)
        const recorder = await this.#recorders.get(browser)
        const scoped = await scopeOf(agent, scope)
        try {
            signal?.throwIfAborted()
            const outcome = await this.#actIn(agent, browser, instruction, options, scoped.ref, recorder, evidence, test)
            /**
             * the last step ended after the test, the call is stopped like any other
             */
            if (signal?.aborted) {
                throw new ActError({ instruction, reason: (signal.reason as Error).message, usage: outcome.usage })
            }
            return outcome
        } catch (err) {
            if (signal?.aborted) {
                await this.#stopped(agent, `act("${instruction}")`, signal)
            }
            throw err
        } finally {
            await scoped.leave?.()
        }
    }

    async #actIn (agent: AgentSession, browser: WebdriverIO.Browser, instruction: string, options: ActOptions, scopeRef: string | undefined, recorder?: EffectRecorder, evidence?: HealEvidence, test?: TestContext): Promise<ActOutcome> {
        const effects: EffectCheck | undefined = recorder ? { recorder, mode: this.effects.mode } : undefined
        const mode = this.mode(options.cache)
        const signal = test?.controller.signal
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
            const replay = await replaySteps(agent, entry.steps, values, waitTimeoutOf(browser), effects, evidence, scopeRef, signal)
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
            const rest = await this.plan(agent, instruction, options, replayContext(replay.done, replay.failed), scopeRef, recorder, test)
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
        const { steps, summary, usage } = await this.plan(agent, instruction, options, undefined, scopeRef, recorder, test)
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
        const test = this.#testOf(browserOf(scope))
        const signal = test?.controller.signal
        const base = { kind: 'extract' as const, ...(test ? { spec: test.spec, test: test.title } : {}), instruction, source: 'model' as const }
        const usage = { input: 0, output: 0 }
        try {
            const { value, evidence } = await this.#oneAtATime(browserOf(scope), () => this.#extract(scope, instruction, schema, options, usage, test))
            this.#record({ ...base, ...(evidence?.length ? { evidence } : {}), usage, durationMs: Date.now() - started })
            return value
        } catch (err) {
            const error = signal?.aborted ? stoppedError(instruction, signal, err, usage) : err as Error
            this.#record({ ...base, error: error.message, usage, durationMs: Date.now() - started })
            throw error
        }
    }

    async #extract<T> (scope: ActScope, instruction: string, schema: StandardSchemaV1<unknown, T>, options: ExtractOptions, usage: TokenUsage, test?: TestContext) {
        const browser = browserOf(scope)
        if ((browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            throw new Error('[@wdio/ai-service] extract() runs on one browser. Call it on an instance, e.g. browser.getInstance(\'myBrowser\').extract(...)')
        }
        const modelOption = selectModel(options.model, this.options.model)
        if (!modelOption) {
            throw new ActError({ instruction, reason: 'no model is configured. Set the `model` option of the service or the WDIO_AI_MODEL environment variable.' })
        }
        const signal = test?.controller.signal
        signal?.throwIfAborted()
        const agent = await this.agentFor(browser)
        const scoped = await scopeOf(agent, scope)
        try {
            signal?.throwIfAborted()
            const read = await this.#extractIn(agent, instruction, schema, options, usage, scoped.ref, test)
            signal?.throwIfAborted()
            return read
        } catch (err) {
            if (signal?.aborted) {
                await this.#stopped(agent, `extract("${instruction}")`, signal)
            }
            throw err
        } finally {
            await scoped.leave?.()
        }
    }

    async #extractIn<T> (agent: AgentSession, instruction: string, schema: StandardSchemaV1<unknown, T>, options: ExtractOptions, usage: TokenUsage, scopeRef?: string, test?: TestContext) {
        const modelOption = selectModel(options.model, this.options.model)!
        const values = options.values || {}
        const workspace = this.#workspaceFor(instruction, test)
        workspace.values = values
        workspace.secrets = this.#rememberSecrets(values)
        await workspace.writeEvents(agent.logs, agent.network)
        const responses = await this.#responses.get(agent.browser)?.catch(() => undefined)
        const withResponses = responses ? await workspace.writeResponses(responses, responses.select({
            contexts: await contextTree(agent.browser, await agent.browser.getWindowHandle().catch(() => undefined)),
            since: test?.startedAt
        })) > 0 : false
        const jsonSchema = jsonSchemaOf(schema)
        const gate = new StepGate(test?.controller.signal)
        const tools = await pageTools({ agent, values, secrets: workspace.secrets, actions: READ_ACTIONS, onStep: () => {}, workspace, scope: scopeRef, gate })
        let feedback = ''
        try {
            for (let attempt = 1; attempt <= 2; attempt++) {
                /**
                 * `extract` and its retry spend the same budget as `act`
                 */
                this.#assertBudget(instruction, usage)
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
                    signal: gate.loopSignal,
                    middleware: [await workspace.middleware()],
                    control: { outcome, tools: await answerTools(outcome, jsonSchema) }
                })
                this.modelCalls += result.modelCalls
                usage.input += result.usage.input
                usage.output += result.usage.output
                if (result.status !== 'done' || outcome.status !== 'done') {
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
            await this.#finishCall(workspace, test)
        }
    }

    #store (cache: ActCache, key: string, entry: { instruction: string, platform: string, steps: ActStep[] }, options: ActOptions, recordedBy?: string) {
        const model = selectModel(options.model, this.options.model)
        const modelName = recordedBy ?? (model ? describeModel(model) : undefined)
        /**
         * heal mode, of the service or of this call, leaves the cache file alone
         */
        cache.set(key, {
            ...entry,
            ...(modelName ? { model: modelName } : {}),
            recordedAt: new Date().toISOString()
        }, this.mode(options.cache) === 'heal' ? 'heal' : 'cache')
    }
}

/**
 * the error of a call whose test ended, with the steps, tokens and evidence of the call
 */
function stoppedError (instruction: string, signal: AbortSignal, err: unknown, usage?: TokenUsage) {
    const details = err instanceof ActError ? err : undefined
    return new ActError({
        instruction,
        reason: (signal.reason as Error).message,
        steps: details?.steps,
        usage: details?.usage ?? usage,
        workspace: details?.workspace
    })
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
