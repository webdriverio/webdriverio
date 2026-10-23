import { aroundEach, beforeAll, afterAll, inject, type RunnerTestCase, type RunnerTestSuite } from 'vitest'
import { SUPPORTED_HOOKS } from '@wdio/config'
import { ConfigParser } from '@wdio/config/node'
import { _setGlobal } from '@wdio/globals'
import { allocateContext, cleanupAllocation, executeHooksWithArgs, initializeWorkerService, type ParallelContextBrowser } from '@wdio/utils'
import { expect, setDefaultOptions, SoftAssertionService, SoftAssertService } from 'expect-webdriverio'
import { remote, PARALLEL_CONTEXT_STORE_KEY } from 'webdriverio'
import { AsyncLocalStorage } from 'node:async_hooks'
import { inspect } from 'node:util'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type * as AllureWorker from '@wdio/allure-reporter/worker'

import { ATTACHMENT_DIR_KEY, ATTEMPT_EVENT, ATTEMPT_HOOK_KINDS, RELAYED_REPORTER_EVENTS, RUNTIME_META_KEY, SESSION_META_KEY, type AttemptError, type AttemptMarker, type RelayedEntry, type RelayedReporterEvent, type SessionMeta } from './types.js'

const log = logger('@wdio/vitest-framework')

// the browser runs these itself; every other WDIO hook is run by this module
const BROWSER_HOOK_KEYS = ['beforeCommand', 'afterCommand', 'onReload']
const RUNNER_HOOK_KEYS = SUPPORTED_HOOKS.filter((key) => !BROWSER_HOOK_KEYS.includes(key))
const CONNECTION_KEYS = ['protocol', 'hostname', 'port', 'path', 'user', 'key'] as const
const EXIT_SIGNALS = ['SIGINT', 'SIGTERM'] as const
const SIGNAL_TEARDOWN_TIMEOUT_MS = 10_000

type ParallelBrowser = WebdriverIO.Browser & ParallelContextBrowser & {
    [PARALLEL_CONTEXT_STORE_KEY]?: AsyncLocalStorage<string>
}

let config: WebdriverIO.Config
let requestedCapabilities: Capabilities.RequestedStandaloneCapabilities
let capabilities: WebdriverIO.Capabilities
let browser: ParallelBrowser | undefined
let softAssertions: SoftAssertionService | undefined
let specFile = ''
let sessionHookArgs: [WebdriverIO.Config, WebdriverIO.Capabilities, string[]] | undefined
let sessionClosing: Promise<void> | undefined

type TestTask = Pick<RunnerTestCase, 'meta' | 'result'>

// content travels through task.meta, which Vitest resends on every task update, so the bytes go to disk
// when the launcher provides an Allure results folder
type AttachmentTransport =
    | { mode: 'inline' }
    | { mode: 'offload', resultsDir: string, offloadAttachment: typeof AllureWorker.offloadAttachment }

type RelayState = { activeTask: AsyncLocalStorage<TestTask>, handlers: Map<string, (payload: unknown) => void>, attachments: AttachmentTransport, warned: Set<string> }

// isolate: false evaluates this module once per spec file in one process, so the listeners and the
// storage they read live on the global to stay a single set
const RELAY_STATE_KEY = Symbol.for('@wdio/vitest-framework:relay')
const globalWithRelay = globalThis as typeof globalThis & { [RELAY_STATE_KEY]?: RelayState }
const relayState = (globalWithRelay[RELAY_STATE_KEY] ??= { activeTask: new AsyncLocalStorage<TestTask>(), handlers: new Map(), attachments: { mode: 'inline' }, warned: new Set() })
const activeTask = relayState.activeTask

function warnOnce(key: string, message: string) {
    if (!relayState.warned.has(key)) {
        relayState.warned.add(key)
        log.warn(message)
    }
}

// not a literal import: @wdio/allure-reporter is optional and must stay out of this package's bundle
const ALLURE_WORKER_MODULE = '@wdio/allure-reporter/worker'

function recordAttempt(task: TestTask, start: number, error: unknown, hooks: AttemptMarker['hooks']) {
    const meta = task.meta as Record<string, unknown>
    const entries = (meta[RUNTIME_META_KEY] ??= []) as RelayedEntry[]
    entries.push({
        event: ATTEMPT_EVENT,
        retry: task.result?.retryCount ?? 0,
        payload: { start, end: Date.now(), state: error === undefined ? 'passed' : 'failed', ...(error !== undefined && { error: serializeError(error) }), ...(hooks && { hooks }) }
    })
}

/**
 * Vitest keeps the last state of each hook kind on the task and appends to task.result.errors across
 * attempts, so this attempt's errors are the ones after `errorsBefore`. A hook that threw stays in the
 * 'run' state; the beforeEach error is the first of an attempt and the afterEach error the last.
 */
function readAttemptHooks(task: TestTask, errorsBefore: number): AttemptMarker['hooks'] {
    const states = (task.result?.hooks ?? {}) as Record<string, string | undefined>
    const errors = (task.result?.errors ?? []).slice(errorsBefore)
    const hooks: NonNullable<AttemptMarker['hooks']> = {}
    for (const kind of ATTEMPT_HOOK_KINDS) {
        const state = states[kind]
        if (state === 'pass') {
            hooks[kind] = { state: 'pass' }
        } else if (state === 'run' || state === 'fail') {
            const error = kind === 'beforeEach' ? errors[0] : errors[errors.length - 1]
            hooks[kind] = { state: 'fail', ...(error && { error: serializeError(error) }) }
        }
    }
    return Object.keys(hooks).length > 0 ? hooks : undefined
}

// task.meta crosses a worker boundary, so the error is reduced to what structured clone keeps
function serializeError(error: unknown): AttemptError {
    const { name, message, stack, expected, actual } = (typeof error === 'object' && error !== null ? error : { message: String(error) }) as Partial<AttemptError>
    return { name, message: message ?? String(error), stack, expected: cloneable(expected), actual: cloneable(actual) }
}

// a value that structured clone rejects (a function, a DOM node) must not break the task update that carries it
function cloneable(value: unknown) {
    try {
        return structuredClone(value)
    } catch {
        return inspect(value, { depth: 5 })
    }
}

function relay(event: RelayedReporterEvent, payload: unknown) {
    const task = activeTask.getStore()
    if (!task) {
        warnOnce('outside-test', `Dropped ${event}: reporter runtime APIs only work in tests and beforeEach/afterEach hooks`)
        return
    }
    const entry = toRuntimeMessage[event](payload)
    if (!entry) {
        return
    }
    const meta = task.meta as Record<string, unknown>
    const entries = (meta[RUNTIME_META_KEY] ??= []) as RelayedEntry[]
    entries.push({ ...entry, retry: task.result?.retryCount ?? 0 })
}

type Converted = Pick<Extract<RelayedEntry, { event: RelayedReporterEvent }>, 'event' | 'payload' | 'pendingFile'>

function toAllureMessage(payload: unknown): Converted {
    const transport = relayState.attachments
    if (transport.mode === 'inline') {
        return { event: 'allure:runtimeMessage', payload }
    }
    try {
        const offloaded = transport.offloadAttachment(payload, transport.resultsDir)
        return offloaded
            ? { event: 'allure:runtimeMessage', payload: offloaded, pendingFile: offloaded.data.path }
            : { event: 'allure:runtimeMessage', payload }
    } catch (err) {
        warnOnce('offload-failure', `Could not write an Allure attachment to ${transport.resultsDir}, sending attachments through the launcher instead: ${(err as Error).message}`)
        return { event: 'allure:runtimeMessage', payload }
    }
}

const toRuntimeMessage: Record<RelayedReporterEvent, (payload: unknown) => Converted | undefined> = {
    'allure:startStep': (name) => ({ event: 'allure:runtimeMessage', payload: { type: 'step_start', data: { name: name as string, start: Date.now() } } }),
    'allure:endStep': (arg) => ({ event: 'allure:runtimeMessage', payload: { type: 'step_stop', data: { ...(typeof arg === 'string' ? { status: arg } : arg as object), stop: Date.now() } } }),
    'allure:runtimeMessage': toAllureMessage,
    'junit:addProperty': (payload) => ({ event: 'junit:addProperty', payload })
}

// converted at call time so step timestamps are the worker's, not the replay's
RELAYED_REPORTER_EVENTS.forEach((event) => {
    const handler = relayState.handlers.get(event) ?? ((payload: unknown) => relay(event, payload))
    relayState.handlers.set(event, handler)
    if (!process.listeners(event as never).includes(handler)) {
        process.on(event, handler)
    }
})

async function resolveAttachmentTransport(resultsDir: string | null | undefined): Promise<AttachmentTransport> {
    if (!resultsDir) {
        return { mode: 'inline' }
    }
    try {
        const worker: typeof AllureWorker = await import(/* @vite-ignore */ ALLURE_WORKER_MODULE)
        return { mode: 'offload', resultsDir, offloadAttachment: worker.offloadAttachment }
    } catch (err) {
        warnOnce('worker-load', `Could not load ${ALLURE_WORKER_MODULE}, sending Allure attachments through the launcher instead: ${(err as Error).message}`)
        return { mode: 'inline' }
    }
}

function stripConnectionKeys(caps: object) {
    return Object.fromEntries(Object.entries(caps).filter(([key]) => !(CONNECTION_KEYS as readonly string[]).includes(key)))
}

function toRemoteOptions(): WebdriverIO.RemoteConfig {
    const options = Object.fromEntries(Object.entries(config).filter(([key]) => !RUNNER_HOOK_KEYS.includes(key as typeof RUNNER_HOOK_KEYS[number])))
    const connection = Object.fromEntries(CONNECTION_KEYS.filter((key) => capabilities[key] !== undefined).map((key) => [key, capabilities[key]]))
    // firstMatch only exists on the W3C object, so it is rebuilt around the stripped entries
    const remoteCapabilities = 'alwaysMatch' in requestedCapabilities
        ? { ...requestedCapabilities, alwaysMatch: stripConnectionKeys(capabilities), ...(requestedCapabilities.firstMatch && { firstMatch: requestedCapabilities.firstMatch.map(stripConnectionKeys) }) }
        : stripConnectionKeys(capabilities)
    return { ...options, ...connection, capabilities: remoteCapabilities } as WebdriverIO.RemoteConfig
}

function closeSession() {
    removeSignalHandlers()
    sessionClosing ??= (async () => {
        try {
            await browser?.deleteSession()
        } finally {
            const args = sessionHookArgs
            sessionHookArgs = undefined
            if (args) {
                await executeHooksWithArgs('afterSession', args[0].afterSession, args)
            }
        }
    })()
    return sessionClosing
}

// Vitest replaces process.exit in its workers with a function that throws, so the worker is ended by
// re-raising the signal once our handlers are gone: the default action reports the conventional 128 + signal status
async function exitOnSignal(signal: typeof EXIT_SIGNALS[number]) {
    let timer: NodeJS.Timeout | undefined
    const timedOut = new Promise((resolve) => { timer = setTimeout(resolve, SIGNAL_TEARDOWN_TIMEOUT_MS) })
    await Promise.race([closeSession().catch(() => {}), timedOut])
    clearTimeout(timer)
    removeSignalHandlers()
    process.kill(process.pid, signal)
}

const signalHandlers = EXIT_SIGNALS.map((signal) => [signal, () => exitOnSignal(signal)] as const)

function removeSignalHandlers() {
    signalHandlers.forEach(([signal, handler]) => process.off(signal, handler))
}

function setGlobals(instance: WebdriverIO.Browser, injectGlobals: boolean | undefined) {
    _setGlobal('browser', instance, injectGlobals)
    _setGlobal('driver', instance, injectGlobals)
    _setGlobal('$', (...args: Parameters<WebdriverIO.Browser['$']>) => instance.$(...args), injectGlobals)
    _setGlobal('$$', (...args: Parameters<WebdriverIO.Browser['$$']>) => instance.$$(...args), injectGlobals)
    _setGlobal('expect', expect, injectGlobals)
}

// Vitest rejects a non-destructured first argument, and only passes the suite second
// eslint-disable-next-line no-empty-pattern
beforeAll(async ({}, suite) => {
    specFile = suite.file.filepath
    sessionHookArgs = undefined
    sessionClosing = undefined
    const configParser = new ConfigParser(inject('wdioConfigFile'), inject('wdioArgs') as ConstructorParameters<typeof ConfigParser>[1])
    await configParser.initialize()
    config = configParser.getConfig() as WebdriverIO.Config
    relayState.attachments = await resolveAttachmentTransport(inject(ATTACHMENT_DIR_KEY))
    // cloned so beforeSession mutations do not leak into the next spec file of this worker
    requestedCapabilities = structuredClone(inject('wdioCapabilities'))
    capabilities = ('alwaysMatch' in requestedCapabilities ? requestedCapabilities.alwaysMatch : requestedCapabilities) as WebdriverIO.Capabilities

    const { ignoredWorkerServices } = inject('wdioArgs') as { ignoredWorkerServices?: string[] }
    // built-in, added ahead of the worker services like the WDIO runner does
    softAssertions = new SoftAssertionService({ autoAssertOnTestEnd: config.autoAssertOnTestEnd ?? true })
    configParser.addService(softAssertions)
    const services = await initializeWorkerService(config, capabilities, ignoredWorkerServices ?? [])
    services.forEach((service) => configParser.addService(service))
    config = configParser.getConfig() as WebdriverIO.Config

    const cid = `${inject('wdioProjectIndex')}-${process.env.VITEST_POOL_ID ?? 0}`
    sessionHookArgs = [config, capabilities, [specFile]]
    await executeHooksWithArgs('beforeSession', config.beforeSession, [config, capabilities, [specFile], cid])

    browser = await remote(toRemoteOptions()) as ParallelBrowser
    signalHandlers.forEach(([signal, handler]) => process.on(signal, handler))
    Object.assign(suite.file.meta, { [SESSION_META_KEY]: { sessionId: browser.sessionId, capabilities: browser.capabilities } satisfies SessionMeta })
    setGlobals(browser, config.injectGlobals)
    setDefaultOptions({ wait: config.waitforTimeout, interval: config.waitforInterval })

    await executeHooksWithArgs('before', config.before, [capabilities, [specFile], browser])
})

// Same meaning as the count a regular WDIO worker passes to `after`: failed tests, with a failed
// suite or hook counting as one. Vitest has settled every test of the file by the time afterAll runs,
// so a test that passed on retry is not counted and a test skipped by a failed beforeAll is not either.
function countFailures(suite: RunnerTestSuite): number {
    const own = suite.result?.errors?.length ? 1 : 0
    return suite.tasks.reduce((sum, child) => sum + (child.type === 'suite' ? countFailures(child) : child.result?.state === 'fail' ? 1 : 0), own)
}

// eslint-disable-next-line no-empty-pattern
afterAll(async ({}, suite) => {
    try {
        await executeHooksWithArgs('after', config?.after, [countFailures(suite), capabilities, [specFile]])
    } finally {
        await closeSession()
    }
})

function assertCanRunConcurrently(instance: ParallelBrowser | undefined): asserts instance is ParallelBrowser {
    if (!config.vitestOpts?.parallelMode) {
        throw new Error("test.concurrent needs vitestOpts.parallelMode ('contexts' | 'userContexts'): concurrent tests would share one window")
    }
    if (!instance?.isBidi) {
        throw new Error('test.concurrent with vitestOpts.parallelMode needs a WebDriver Bidi session. Set `webSocketUrl: true` and do not enforce classic WebDriver.')
    }
    if (!instance[PARALLEL_CONTEXT_STORE_KEY]) {
        throw new Error(`browser.${PARALLEL_CONTEXT_STORE_KEY} is missing: test.concurrent needs a webdriverio version with parallel context support`)
    }
}

/**
 * Vitest parses the source of a hook's second parameter for fixture names and rejects
 * anything but object destructuring without rest, so the context is read from `args`
 */
aroundEach(async (...args) => {
    const [runTest, context] = args
    const { task } = context
    const test = { title: task.name, fullTitle: task.fullName, parent: task.suite?.name ?? '', file: specFile }
    const startedAt = Date.now()

    const errorsBefore = task.result?.errors?.length ?? 0
    let error: unknown
    let serviceError: unknown
    let testRan = false
    const runAttempt = async () => {
        try {
            await executeHooksWithArgs('beforeTest', config.beforeTest, [test, context])
        } catch (err) {
            error = err
            throw err
        }
        try {
            testRan = true
            await runTest()
            // runTest() resolves even when the test fails; the outcome is on the task
            error = task.result?.state === 'fail' ? task.result.errors?.[0] ?? new Error('test failed') : undefined
        } catch (err) {
            error = err
            throw err
        } finally {
            const report = {
                error,
                result: undefined,
                passed: error === undefined,
                duration: Date.now() - startedAt,
                retries: { limit: typeof task.retry === 'number' ? task.retry : 0, attempts: task.result?.retryCount ?? 0 },
                skipped: task.mode === 'skip' || task.result?.state === 'skip',
                exception: error instanceof Error ? error.message : '',
                status: error === undefined ? 'passed' : 'failed'
            }
            try {
                await executeHooksWithArgs('afterTest', config.afterTest, [test, context, report])
                // afterTest services such as the soft assertion service report a failure by mutating the report
                if (error === undefined) {
                    serviceError = report.error
                } else if (softAssertions) {
                    // the service skips asserting a test that already failed and leaves its failures for the retry to throw
                    SoftAssertService.getInstance().clearFailures(softAssertions['getTestId'](test))
                }
            } finally {
                recordAttempt(task, startedAt, error ?? serviceError)
            }
        }
        if (serviceError !== undefined) {
            throw serviceError
        }
    }
    const runWithHooks = async () => {
        try {
            await runAttempt()
        } finally {
            // before runTest the hook states are still the previous attempt's
            recordAttempt(task, startedAt, error ?? serviceError, testRan ? readAttemptHooks(task, errorsBefore) : undefined)
        }
    }

    const runInTask = () => activeTask.run(task, runWithHooks)
    if (!task.concurrent) {
        return runInTask()
    }
    assertCanRunConcurrently(browser)
    const allocation = await allocateContext(browser, config.vitestOpts!.parallelMode!)
    try {
        await browser[PARALLEL_CONTEXT_STORE_KEY]!.run(allocation.context, runInTask)
    } finally {
        await cleanupAllocation(browser, allocation)
    }
})
