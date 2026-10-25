import path from 'node:path'
import { spawn } from 'node:child_process'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
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

vi.mock('@wdio/allure-reporter', () => ({ addAttachment: vi.fn(), addArgument: vi.fn() }))

vi.mock('@wdio/globals', () => ({
    browser: {
        isBidi: true,
        sessionId: 'session-1',
        capabilities: { browserName: 'chrome' },
        options: {},
        getWindowHandle: vi.fn().mockResolvedValue('main-tab'),
        takeScreenshot: vi.fn().mockResolvedValue('Y2xhc3NpYw=='),
        browsingContextCaptureScreenshot: vi.fn(async ({ context }: { context: string }) => ({ data: Buffer.from(context).toString('base64') })),
        browsingContextGetTree: vi.fn().mockResolvedValue({ contexts: [{ context: 'main-tab', children: [] }] }),
        on: vi.fn()
    }
}))

const sleep = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

// the real base reporter: its tree and its events, as the frameworks send them
let current: string | undefined
const startReporter = async (options = {}, instance: Record<string, unknown> = { framework: 'mocha' }) => {
    const reporter = new VideoReporter({ saveAllVideos: true, writeStream: { write: vi.fn() }, ...options } as never)
    reporter.setContextIdResolver(() => current)
    reporter.onRunnerStart({
        isMultiRemote: false,
        sessionId: 'session-1',
        config: { outputDir: '/out' },
        instanceOptions: { 'session-1': { ...instance, reporters: [] } }
    } as never)
    await sleep(0)
    return reporter
}
const suite = (uid: string, parentUid: string | null) => ({ uid, title: uid, type: 'suite', cid: '0-0', file: '/spec.js', parentUid })
const test = (uid: string, parentUid: string, extra: Record<string, unknown> = {}) => ({ uid, title: 'flaky', fullTitle: `${parentUid} flaky`, type: 'test', cid: '0-0', parentUid, ...extra })
const videos = () => vi.mocked(spawn).mock.calls.map(([, args]) => path.basename((args as string[]).at(-1)!))

describe('parallel video names from the reporter tree', () => {
    beforeEach(() => {
        current = undefined
    })
    const nameOf = (reporter: VideoReporter, contextId: string) => {
        current = contextId
        return path.basename(reporter.recordingPath!)
    }

    it.each([
        ['test', 'P8-same-title--CHROME--', 'P1--CHROME--'],
        ['suite', 'par--one--CHROME--', 'par--CHROME--']
    ])('names a parallel Mocha test like sequential mode (filenamePrefixSource: %s)', async (filenamePrefixSource, nameA, nameB) => {
        const reporter = await startReporter({ filenamePrefixSource })
        // Mocha parallel mode starts all suites before the first test
        reporter.emit('suite:start', { ...suite('suite-1', null), title: 'par' })
        reporter.emit('suite:start', { ...suite('suite-2', 'suite-1'), title: 'one' })
        reporter.emit('suite:start', { ...suite('suite-3', null), title: 'other' })
        current = 'ctx-a'
        reporter.emit('test:start', test('a', 'suite-2', { title: 'P8 same title', contextId: 'ctx-a' }))
        current = 'ctx-b'
        reporter.emit('test:start', test('b', 'suite-1', { title: 'P1', contextId: 'ctx-b' }))

        expect(nameOf(reporter, 'ctx-a').startsWith(nameA)).toBe(true)
        expect(nameOf(reporter, 'ctx-b').startsWith(nameB)).toBe(true)
    })

    it.each([
        [false, 'test', 'scenario-two--CHROME--'],
        [false, 'suite', 'feature--scenario-two--CHROME--'],
        [true, 'test', 'scenario-two--CHROME--'],
        [true, 'suite', 'feature--CHROME--']
    ])('names a parallel Cucumber scenario like sequential mode (scenarioLevelReporter: %s, filenamePrefixSource: %s)', async (scenarioLevelReporter, filenamePrefixSource, name) => {
        const reporter = await startReporter({ filenamePrefixSource }, { framework: 'cucumber', cucumberOpts: { scenarioLevelReporter } })
        reporter.emit('suite:start', { ...suite('feature-1', null), title: 'feature', type: 'feature' })
        for (const [uid, contextId, title] of [['s1', 'ctx-a', 'scenario one'], ['s2', 'ctx-b', 'scenario two']]) {
            current = contextId
            if (scenarioLevelReporter) {
                reporter.emit('test:start', test(uid, 'feature-1', { title, contextId }))
            } else {
                reporter.emit('suite:start', { ...suite(uid, 'feature-1'), title, type: 'scenario', contextId })
            }
        }

        // the second scenario starts while the first one runs
        expect(nameOf(reporter, 'ctx-b').startsWith(name)).toBe(true)
    })
})

describe('video of a retried test (saveAllVideos: false)', () => {
    beforeEach(() => {
        current = undefined
        vi.mocked(spawn).mockClear()
    })

    // Mocha `retries`: a failed attempt ends with test:retry, the next attempt starts with the same title
    const retryThen = async (last: 'test:pass' | 'test:fail') => {
        const reporter = await startReporter({ saveAllVideos: false })
        reporter.emit('suite:start', suite('s', null))
        reporter.emit('test:start', test('t1', 's'))
        reporter.emit('test:retry', { ...test('t1', 's'), error: { message: 'first attempt' } })
        reporter.emit('test:start', test('t1-retry', 's', { retries: 1 }))
        reporter.emit(last, { ...test('t1-retry', 's'), ...(last === 'test:fail' && { error: { message: 'last attempt' } }) })
        reporter.emit('test:end', test('t1-retry', 's'))
        reporter.emit('suite:end', suite('s', null))
        await sleep()
        return reporter
    }

    it('makes no video for a test that passed on retry: its last attempt passed', async () => {
        await retryThen('test:pass')
        expect(videos()).toEqual([])
    })

    it('makes one video, with both attempts, for a test that failed in every attempt', async () => {
        await retryThen('test:fail')
        expect(videos()).toHaveLength(1)
    })
})
