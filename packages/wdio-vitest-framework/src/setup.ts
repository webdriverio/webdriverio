import { aroundEach, beforeAll, afterAll, inject } from 'vitest'
import { ConfigParser } from '@wdio/config/node'
import { allocateContext, cleanupAllocation, executeHooksWithArgs, initializeWorkerService, type ParallelContextBrowser } from '@wdio/utils'
import { expect, setDefaultOptions } from 'expect-webdriverio'
import { remote, PARALLEL_CONTEXT_STORE_KEY } from 'webdriverio'
import type { AsyncLocalStorage } from 'node:async_hooks'
import type { Capabilities } from '@wdio/types'

import { SESSION_META_KEY, type SessionMeta } from './types.js'

const COMMAND_HOOK_KEYS = ['beforeCommand', 'afterCommand']
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
let specFile = ''
let failures = 0
let sessionHookArgs: [WebdriverIO.Config, WebdriverIO.Capabilities, string[]] | undefined
let sessionClosing: Promise<void> | undefined

function stripConnectionKeys(caps: object) {
    return Object.fromEntries(Object.entries(caps).filter(([key]) => !(CONNECTION_KEYS as readonly string[]).includes(key)))
}

/** The WDIO hooks from the config are run by this module, so remote() only gets the plain options plus the command hooks, which the browser runs itself. */
function toRemoteOptions(): WebdriverIO.RemoteConfig {
    const options = Object.fromEntries(Object.entries(config).filter(([key, value]) => (
        COMMAND_HOOK_KEYS.includes(key) || (typeof value !== 'function' && !(Array.isArray(value) && value.some((entry) => typeof entry === 'function')))
    )))
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

function setGlobals(instance: WebdriverIO.Browser) {
    Object.assign(globalThis, {
        browser: instance,
        driver: instance,
        $: (...args: Parameters<WebdriverIO.Browser['$']>) => instance.$(...args),
        $$: (...args: Parameters<WebdriverIO.Browser['$$']>) => instance.$$(...args),
        expect
    })
}

// Vitest rejects a non-destructured first argument, and only passes the suite second
// eslint-disable-next-line no-empty-pattern
beforeAll(async ({}, suite) => {
    specFile = suite.file.filepath
    failures = 0
    sessionHookArgs = undefined
    sessionClosing = undefined
    try {
        const configParser = new ConfigParser(inject('wdioConfigFile'), inject('wdioArgs') as ConstructorParameters<typeof ConfigParser>[1])
        await configParser.initialize()
        config = configParser.getConfig() as WebdriverIO.Config
        // cloned so beforeSession mutations do not leak into the next spec file of this worker
        requestedCapabilities = structuredClone(inject('wdioCapabilities'))
        capabilities = ('alwaysMatch' in requestedCapabilities ? requestedCapabilities.alwaysMatch : requestedCapabilities) as WebdriverIO.Capabilities

        const { ignoredWorkerServices } = inject('wdioArgs') as { ignoredWorkerServices?: string[] }
        const services = await initializeWorkerService(config, capabilities, ignoredWorkerServices ?? [])
        services.forEach((service) => configParser.addService(service))
        config = configParser.getConfig() as WebdriverIO.Config

        const cid = `${inject('wdioProjectIndex')}-${process.env.VITEST_POOL_ID ?? 0}`
        sessionHookArgs = [config, capabilities, [specFile]]
        await executeHooksWithArgs('beforeSession', config.beforeSession, [config, capabilities, [specFile], cid])

        browser = await remote(toRemoteOptions()) as ParallelBrowser
        signalHandlers.forEach(([signal, handler]) => process.on(signal, handler))
        Object.assign(suite.file.meta, { [SESSION_META_KEY]: { sessionId: browser.sessionId, capabilities: browser.capabilities } satisfies SessionMeta })
        setGlobals(browser)
        setDefaultOptions({ wait: config.waitforTimeout, interval: config.waitforInterval })

        await executeHooksWithArgs('before', config.before, [capabilities, [specFile], browser])
    } catch (err) {
        failures++
        throw err
    }
})

afterAll(async () => {
    try {
        await executeHooksWithArgs('after', config?.after, [failures, capabilities, [specFile]])
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

    let error: unknown
    const runWithHooks = async () => {
        await executeHooksWithArgs('beforeTest', config.beforeTest, [test, context])
        try {
            await runTest()
            // runTest() resolves even when the test fails; the outcome is on the task
            error = task.result?.state === 'fail' ? task.result.errors?.[0] ?? new Error('test failed') : undefined
        } catch (err) {
            error = err
            throw err
        } finally {
            if (error !== undefined) {
                failures++
            }
            await executeHooksWithArgs('afterTest', config.afterTest, [test, context, {
                error,
                result: undefined,
                passed: error === undefined,
                duration: Date.now() - startedAt,
                retries: { limit: typeof task.retry === 'number' ? task.retry : 0, attempts: task.result?.retryCount ?? 0 },
                skipped: task.mode === 'skip' || task.result?.state === 'skip',
                exception: error instanceof Error ? error.message : '',
                status: error === undefined ? 'passed' : 'failed'
            }])
        }
    }

    if (!task.concurrent) {
        return runWithHooks()
    }
    assertCanRunConcurrently(browser)
    const allocation = await allocateContext(browser, config.vitestOpts!.parallelMode!)
    try {
        await browser[PARALLEL_CONTEXT_STORE_KEY]!.run(allocation.context, runWithHooks)
    } finally {
        await cleanupAllocation(browser, allocation)
    }
})
