import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import { browser } from '@wdio/globals'
import VideoReporter from '../src/index.js'

vi.mock('node:fs', () => {
    const mod = {
        writeFileSync: vi.fn(),
        createWriteStream: vi.fn(),
        mkdirSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(false),
    }
    return { ...mod, default: mod }
})

vi.mock('node:child_process', async () => {
    const { EventEmitter } = await import('node:events')
    return {
        spawn: vi.fn(() => {
            const cp = Object.assign(new EventEmitter(), { stderr: new EventEmitter() })
            setTimeout(() => cp.emit('close', 0))
            return cp
        })
    }
})

const logMock = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }))
vi.mock('@wdio/logger', () => ({ default: () => logMock }))

vi.mock('../src/helpers.js', async (importOriginal) => ({
    ...await importOriginal<typeof HelpersModule>(),
    findFfmpeg: vi.fn(() => '/foo/bar/ffmpeg')
}))

vi.mock('@wdio/reporter', () => ({
    default: class {
        options: unknown
        write = vi.fn()
        constructor (options: unknown) {
            this.options = options
        }
    }
}))

vi.mock('@wdio/allure-reporter', () => ({
    addAttachment: vi.fn(),
    addArgument: vi.fn()
}))

const listeners = vi.hoisted(() => ({} as Record<string, (payload: unknown) => void>))
vi.mock('@wdio/globals', () => ({
    browser: {
        isBidi: true,
        sessionId: 'session-1',
        capabilities: { browserName: 'chrome' },
        options: {},
        getWindowHandle: vi.fn().mockResolvedValue('main-tab'),
        takeScreenshot: vi.fn().mockResolvedValue('Y2xhc3NpYw=='),
        browsingContextCaptureScreenshot: vi.fn(async ({ context }: { context: string }) => ({ data: Buffer.from(context).toString('base64') })),
        browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [
            { context: 'main-tab', children: [] },
            { context: 'ctx-a', children: [] },
            { context: 'ctx-b', children: [] },
            { context: 'ctx-c', children: [] }
        ] }),
        on: vi.fn((event: string, fn: (payload: unknown) => void) => {
            listeners[event] = fn
        })
    }
}))

const sleep = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

const runner: any = {
    isMultiRemote: false,
    sessionId: 'session-1',
    config: { outputDir: '/out' },
    instanceOptions: { 'session-1': { framework: 'mocha', reporters: [] } }
}

/**
 * the context of the calling code: in parallel mode `getContextId()` of `@wdio/reporter`
 */
let current: string | undefined
const inContext = (id?: string) => {
    current = id
}

let commandId = 0
/**
 * a BiDi navigation sent in the context of the calling code, and its result,
 * which comes from the socket without a context
 */
const navigate = (context: string) => {
    const id = ++commandId
    listeners.bidiCommand({ id, method: 'browsingContext.navigate', params: { context } })
    return () => {
        inContext(undefined)
        listeners.bidiResult({ id, type: 'success', result: {} })
    }
}

const startReporter = async (options = {}) => {
    const reporter = new VideoReporter({ saveAllVideos: true, ...options })
    ;(reporter as unknown as { getContextId: () => string | undefined }).getContextId = () => current
    reporter.onRunnerStart(runner)
    await sleep(0)
    return reporter
}

const test = (uid: string, contextId: string, extra = {}) => ({ uid, title: uid, contextId, parentUid: 'suite-1', ...extra }) as any

/** the frames written into each recording folder */
const framesByFolder = () => {
    const folders: Record<string, number> = {}
    for (const [file] of vi.mocked(fs.writeFileSync).mock.calls) {
        const folder = path.dirname(String(file))
        folders[folder] = (folders[folder] ?? 0) + 1
    }
    return folders
}

describe('parallel mode', () => {
    beforeEach(() => {
        inContext(undefined)
        vi.mocked(fs.writeFileSync).mockClear()
        vi.mocked(spawn).mockClear()
        vi.mocked(browser.browsingContextCaptureScreenshot).mockClear()
    })

    it('records 3 overlapping tests into 3 folders', async () => {
        const reporter = await startReporter()
        const results: (() => void)[] = []
        for (const name of ['a', 'b', 'c']) {
            inContext(`ctx-${name}`)
            reporter.onTestStart(test(name, `ctx-${name}`))
            results.push(navigate(`ctx-${name}`))
        }
        results.forEach((result) => result())
        // a classic command of test b
        reporter.onAfterCommand({ endpoint: '/session/session-1/url', method: 'POST', contextId: 'ctx-b' } as any)
        await sleep()

        for (const name of ['c', 'a', 'b']) {
            inContext(`ctx-${name}`)
            reporter.onTestEnd(test(name, `ctx-${name}`, { state: 'passed' }))
        }
        await sleep()

        const inputs = vi.mocked(spawn).mock.calls.map(([, args]) => path.dirname((args as string[])[(args as string[]).indexOf('-i') + 1]))
        expect(new Set(inputs).size).toBe(3)
        const frames = framesByFolder()
        // a, c: navigation + end frame; b: navigation + classic command + end frame
        expect(inputs.map((folder) => frames[folder])).toEqual([2, 2, 3])
    })

    it('takes a BiDi frame in the recording of the context that sent the command', async () => {
        const reporter = await startReporter()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        const result = navigate('ctx-a')
        inContext('ctx-b')
        reporter.onTestStart(test('b', 'ctx-b'))
        result()
        await sleep()

        inContext('ctx-a')
        expect(reporter.frameNr).toBe(1)
        inContext('ctx-b')
        expect(reporter.frameNr).toBe(0)
    })

    it('captures the window of the test', async () => {
        const reporter = await startReporter()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        // a classic command takes the frame of the window, not of the last BiDi context
        reporter.onAfterCommand({ endpoint: '/session/session-1/url', method: 'POST', contextId: 'ctx-a' } as any)
        reporter.onTestEnd(test('a', 'ctx-a', { state: 'passed' }))
        await sleep()

        const contexts = vi.mocked(browser.browsingContextCaptureScreenshot).mock.calls.map(([params]) => (params as { context: string }).context)
        expect(contexts).toEqual(['ctx-a', 'ctx-a'])
    })

    it('drops a BiDi frame whose test ended', async () => {
        const reporter = await startReporter()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        const result = navigate('ctx-a')
        reporter.onTestEnd(test('a', 'ctx-a', { state: 'passed' }))
        inContext('ctx-b')
        reporter.onTestStart(test('b', 'ctx-b'))
        await sleep()
        const written = vi.mocked(fs.writeFileSync).mock.calls.length

        result()
        await sleep()

        expect(vi.mocked(fs.writeFileSync).mock.calls.length).toBe(written)
        inContext('ctx-b')
        expect(reporter.frameNr).toBe(0)
    })

    it('takes no frame for a command outside a test in parallel mode', async () => {
        const reporter = await startReporter()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        inContext(undefined)

        navigate('main-tab')()
        expect(reporter.onAfterCommand({ endpoint: '/session/session-1/url', method: 'POST' } as any)).toBe(false)
        await sleep()

        expect(fs.writeFileSync).not.toBeCalled()
        expect(reporter.recordingPath).toBeUndefined()
        inContext('ctx-a')
        expect(reporter.frameNr).toBe(0)
    })
})

describe('parallel video names', () => {
    const cucumberRunner = (scenarioLevelReporter = false): any => ({
        ...runner,
        instanceOptions: { 'session-1': { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter }, reporters: [] } }
    })
    const nameOf = (reporter: VideoReporter, contextId: string) => {
        inContext(contextId)
        return path.basename(reporter.recordingPath!)
    }

    beforeEach(() => {
        inContext(undefined)
    })

    it.each([
        ['test', 'P8-same-title--CHROME--', 'P1--CHROME--'],
        ['suite', 'par--one--CHROME--', 'par--CHROME--']
    ])('names a parallel Mocha test like sequential mode (filenamePrefixSource: %s)', async (filenamePrefixSource, nameA, nameB) => {
        const reporter = await startReporter({ filenamePrefixSource })
        // Mocha parallel mode starts all suites before the first test
        reporter.onSuiteStart({ uid: 'suite-1', title: 'par', type: 'suite', parentUid: null } as any)
        reporter.onSuiteStart({ uid: 'suite-2', title: 'one', type: 'suite', parentUid: 'suite-1' } as any)
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a', { title: 'P8 same title', parentUid: 'suite-2' }))
        inContext('ctx-b')
        reporter.onTestStart(test('b', 'ctx-b', { title: 'P1', parentUid: 'suite-1' }))

        expect(nameOf(reporter, 'ctx-a').startsWith(nameA)).toBe(true)
        expect(nameOf(reporter, 'ctx-b').startsWith(nameB)).toBe(true)
    })

    it.each([
        [false, 'test', 'scenario-two--CHROME--'],
        [false, 'suite', 'feature--scenario-two--CHROME--'],
        [true, 'test', 'scenario-two--CHROME--'],
        [true, 'suite', 'feature--CHROME--']
    ])('names a parallel Cucumber scenario like sequential mode (scenarioLevelReporter: %s, filenamePrefixSource: %s)', async (scenarioLevel, filenamePrefixSource, name) => {
        const reporter = new VideoReporter({ saveAllVideos: true, filenamePrefixSource } as any)
        ;(reporter as unknown as { getContextId: () => string | undefined }).getContextId = () => current
        reporter.onRunnerStart(cucumberRunner(scenarioLevel))
        await sleep(0)
        reporter.onSuiteStart({ uid: 'feature-1', title: 'feature', type: 'feature' } as any)
        for (const [uid, contextId, title] of [['s1', 'ctx-a', 'scenario one'], ['s2', 'ctx-b', 'scenario two']]) {
            inContext(contextId)
            if (scenarioLevel) {
                reporter.onTestStart(test(uid, contextId, { title, parentUid: 'feature-1' }))
            } else {
                reporter.onSuiteStart({ uid, title, type: 'scenario', parentUid: 'feature-1', contextId } as any)
            }
        }

        // the second scenario starts while the first one runs
        expect(nameOf(reporter, 'ctx-b').startsWith(name)).toBe(true)
    })

    it('gives 2 recordings with the same name and time their own folders', async () => {
        const reporter = await startReporter()
        vi.useFakeTimers({ toFake: ['Date'] })
        try {
            vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0, 0))
            inContext('ctx-a')
            reporter.onTestStart(test('a', 'ctx-a', { title: 'outline' }))
            inContext('ctx-b')
            reporter.onTestStart(test('b', 'ctx-b', { title: 'outline' }))
        } finally {
            vi.useRealTimers()
        }

        expect(nameOf(reporter, 'ctx-b')).toBe(`${nameOf(reporter, 'ctx-a')}-2`)
    })
})

describe('Cucumber end events in parallel mode', () => {
    const cucumberReporter = async (scenarioLevelReporter = false) => {
        const reporter = new VideoReporter({ saveAllVideos: true })
        ;(reporter as unknown as { getContextId: () => string | undefined }).getContextId = () => current
        reporter.onRunnerStart({ ...runner, instanceOptions: { 'session-1': { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter }, reporters: [] } } })
        await sleep(0)
        return reporter
    }
    // Cucumber parallel mode sends test:pass (or test:fail), then test:end
    const passAndEnd = (reporter: VideoReporter, uid: string) => {
        const stats = test(uid, 'ctx-a', { state: 'passed', parentUid: 's1' })
        reporter.onTestPass(stats)
        reporter.onTestEnd(stats)
    }

    beforeEach(() => {
        inContext('ctx-a')
        vi.mocked(spawn).mockClear()
    })

    it('renders a scenario one time when Cucumber sends test:pass and test:end', async () => {
        const reporter = await cucumberReporter(true)
        reporter.onTestStart(test('s1', 'ctx-a', { title: 'scenario' }))
        passAndEnd(reporter, 's1')
        await sleep()

        expect(spawn).toBeCalledTimes(1)
    })

    it('adds one end frame for a step that gets test:pass and test:end', async () => {
        const reporter = await cucumberReporter()
        reporter.onSuiteStart({ uid: 's1', title: 'scenario', type: 'scenario', parentUid: 'f1', contextId: 'ctx-a' } as any)
        reporter.onTestStart(test('step-1', 'ctx-a', { parentUid: 's1' }))
        passAndEnd(reporter, 'step-1')

        expect(reporter.frameNr).toBe(1)
    })

    it('keeps one recording for a retried scenario in parallel mode', async () => {
        const reporter = await cucumberReporter()
        vi.mocked(fs.mkdirSync).mockClear()
        const scenario = { uid: 's1', title: 'scenario', type: 'scenario', parentUid: 'f1', contextId: 'ctx-a', tests: [{ state: 'passed' }], hooks: [] } as any
        reporter.onSuiteStart(scenario)
        reporter.onTestStart(test('step-1', 'ctx-a', { parentUid: 's1' }))
        passAndEnd(reporter, 'step-1')
        // the retry runs in the same window, with the same scenario uid and new step uids
        reporter.onSuiteRetry(scenario)
        reporter.onTestStart(test('step-2', 'ctx-a', { parentUid: 's1' }))
        passAndEnd(reporter, 'step-2')
        reporter.onSuiteEnd(scenario)
        await sleep()

        expect(fs.mkdirSync).toBeCalledTimes(1)
        expect(spawn).toBeCalledTimes(1)
    })
})

describe('frame waits in parallel mode', () => {
    type Hook = (commandName: string, args?: unknown[]) => Promise<unknown> | undefined
    /** the beforeCommand hook of the last reporter (the browser mock is shared) */
    const lastHook = () => {
        const hooks = (browser.options as { beforeCommand: Hook[] }).beforeCommand
        return hooks[hooks.length - 1]
    }
    /** captures that answer only when the test says so */
    const heldCaptures = () => {
        const held: (() => void)[] = []
        vi.mocked(browser.browsingContextCaptureScreenshot).mockImplementation(({ context }: any) => new Promise((resolve) => {
            held.push(() => resolve({ data: Buffer.from(context).toString('base64') } as any))
        }))
        return () => held.splice(0).forEach((release) => release())
    }
    const settled = async (promise: unknown) => {
        let done = false
        void Promise.resolve(promise).then(() => { done = true })
        await sleep()
        return done
    }

    afterEach(() => {
        vi.mocked(browser.browsingContextCaptureScreenshot).mockImplementation(async ({ context }: any) => ({ data: Buffer.from(context).toString('base64') }) as any)
    })

    it('does not make a command of test B wait for the frame of test A', async () => {
        const reporter = await startReporter()
        heldCaptures()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        navigate('ctx-a')()
        inContext('ctx-b')
        reporter.onTestStart(test('b', 'ctx-b'))

        expect(await settled(lastHook()('url'))).toBe(true)
        inContext('ctx-a')
        expect(await settled(lastHook()('url'))).toBe(false)
    })

    it('waits for the last frame before the test window closes', async () => {
        const reporter = await startReporter()
        const release = heldCaptures()
        inContext('ctx-a')
        reporter.onTestStart(test('a', 'ctx-a'))
        reporter.onTestEnd(test('a', 'ctx-a', { state: 'passed' }))
        // the framework closes the window outside the test context
        inContext(undefined)
        const close = lastHook()('browsingContextClose', [{ context: 'ctx-a' }])

        expect(await settled(close)).toBe(false)
        release()
        expect(await settled(close)).toBe(true)
        expect(close).toBeInstanceOf(Promise)
    })
})
