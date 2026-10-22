import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

import { describe, it, expect, vi, beforeEach } from 'vitest'
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
