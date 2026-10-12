import { aroundEach, beforeAll, afterAll, inject } from 'vitest'
import { ConfigParser } from '@wdio/config/node'
import { allocateContext, cleanupAllocation, executeHooksWithArgs, type ParallelContextBrowser } from '@wdio/utils'
import { expect, setDefaultOptions } from 'expect-webdriverio'
import { remote, PARALLEL_CONTEXT_STORE_KEY } from 'webdriverio'
import type { AsyncLocalStorage } from 'node:async_hooks'

const CONNECTION_KEYS = ['protocol', 'hostname', 'port', 'path', 'user', 'key'] as const

type ParallelBrowser = WebdriverIO.Browser & ParallelContextBrowser & {
    [PARALLEL_CONTEXT_STORE_KEY]?: AsyncLocalStorage<string>
}

let config: WebdriverIO.Config
let capabilities: WebdriverIO.Capabilities
let browser: ParallelBrowser | undefined
let specFile = ''
let failures = 0

/** The WDIO hooks from the config are run by this module (not worker services), so remote() only gets the plain options. */
function toRemoteOptions(): WebdriverIO.RemoteConfig {
    const options = Object.fromEntries(Object.entries(config).filter(([, value]) => (
        typeof value !== 'function' && !(Array.isArray(value) && value.some((entry) => typeof entry === 'function'))
    )))
    const connection = Object.fromEntries(CONNECTION_KEYS.filter((key) => capabilities[key] !== undefined).map((key) => [key, capabilities[key]]))
    const sessionCapabilities = Object.fromEntries(Object.entries(capabilities).filter(([key]) => !(CONNECTION_KEYS as readonly string[]).includes(key)))
    return { ...options, ...connection, capabilities: sessionCapabilities } as WebdriverIO.RemoteConfig
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
    try {
        const configParser = new ConfigParser(inject('wdioConfigFile'))
        await configParser.initialize()
        config = configParser.getConfig() as WebdriverIO.Config
        capabilities = inject('wdioCapabilities')

        browser = await remote(toRemoteOptions()) as ParallelBrowser
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
        await browser?.deleteSession()
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

aroundEach(async (runTest, context) => {
    const { task } = context
    const test = { title: task.name, fullTitle: task.fullName, parent: task.suite?.name ?? '', file: specFile }
    const startedAt = Date.now()

    await executeHooksWithArgs('beforeTest', config.beforeTest, [test, context])
    let error: unknown
    try {
        if (task.concurrent) {
            assertCanRunConcurrently(browser)
            const allocation = await allocateContext(browser, config.vitestOpts!.parallelMode!)
            try {
                await browser[PARALLEL_CONTEXT_STORE_KEY]!.run(allocation.context, runTest)
            } finally {
                await cleanupAllocation(browser, allocation)
            }
        } else {
            await runTest()
        }
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
            retries: { limit: 0, attempts: 0 },
            exception: error instanceof Error ? error.message : '',
            status: error === undefined ? 'passed' : 'failed'
        }])
    }
})
