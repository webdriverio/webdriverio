import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, it, expect, vi, afterEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import VideoReporter from '../src/index.js'
import { waitForVideosToExist, waitForVideosToBeWritten } from '../src/helpers.js'

vi.mock('../src/helpers.js', async (importOriginal) => {
    const helpers = await importOriginal<typeof HelpersModule>()
    return {
        ...helpers,
        findFfmpeg: vi.fn(() => '/foo/bar/ffmpeg'),
        sleep: vi.fn(),
        waitForVideosToExist: vi.fn(helpers.waitForVideosToExist),
        waitForVideosToBeWritten: vi.fn(helpers.waitForVideosToBeWritten)
    }
})

vi.mock('@wdio/reporter', async () => ({
    // the real rule for the name of the framework
    knownFramework: (await vi.importActual<{ knownFramework: unknown }>('../../wdio-reporter/src/utils.js')).knownFramework,
    default: class {
        options: unknown
        write = vi.fn()
        constructor (options: unknown) {
            this.options = options
        }
    }
}))

vi.mock('@wdio/allure-reporter', () => ({ addAttachment: vi.fn(), addArgument: vi.fn() }))

vi.mock('@wdio/globals', () => ({ browser: { capabilities: { browserName: 'chrome' }, on: vi.fn() } }))

describe('onExit', () => {
    const dirs: string[] = []
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('waits for the videos at most videoRenderTimeout in all', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-exit-'))
        dirs.push(dir)
        const allureDir = path.join(dir, 'allure')
        fs.mkdirSync(allureDir)
        const video = path.join(dir, 'my-video.webm')
        fs.writeFileSync(video, Buffer.alloc(2048, 1))
        const reporter = new VideoReporter({ videoRenderTimeout: 1000 })
        reporter.onRunnerStart({
            isMultiRemote: false,
            sessionId: '1',
            config: { outputDir: dir },
            instanceOptions: { 1: { reporters: [['allure', { outputDir: allureDir }]] } }
        } as never)
        reporter.videos.push(video)
        vi.useFakeTimers({ toFake: ['Date'] })
        try {
            // the wait for the files takes 800 ms of the 1000 ms
            vi.mocked(waitForVideosToExist).mockImplementationOnce(() => {
                vi.setSystemTime(Date.now() + 800)
                return true
            })
            vi.mocked(waitForVideosToBeWritten).mockImplementationOnce(() => true)
            reporter.onExit()
        } finally {
            vi.useRealTimers()
        }
        expect(vi.mocked(waitForVideosToBeWritten).mock.calls.at(-1)?.[1]).toBeLessThanOrEqual(200)
    })

    it('does not throw when a video of this worker is missing (ffmpeg failed)', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-exit-'))
        dirs.push(dir)
        const allureDir = path.join(dir, 'allure')
        fs.mkdirSync(allureDir)
        const missingVideo = path.join(dir, 'failed-render.webm')
        fs.writeFileSync(path.join(allureDir, 'a-attachment.webm'), missingVideo)
        fs.writeFileSync(path.join(allureDir, '1-result.json'), JSON.stringify({
            name: 'fails',
            steps: [{ name: 'Execution video', attachments: [{ name: 'Execution video', source: 'a-attachment.webm', type: 'video/webm' }] }]
        }))

        const reporter = new VideoReporter({ videoRenderTimeout: 200 })
        reporter.onRunnerStart({
            isMultiRemote: false,
            sessionId: '1',
            config: { outputDir: dir },
            instanceOptions: { 1: { reporters: [['allure', { outputDir: allureDir }]] } }
        } as never)
        reporter.videos.push(missingVideo)
        reporter.allureVideos.push(missingVideo)

        expect(() => reporter.onExit()).not.toThrow()
        // no video: no attachment that holds the path as text
        expect(fs.existsSync(path.join(allureDir, 'a-attachment.webm'))).toBe(false)
        const result = JSON.parse(fs.readFileSync(path.join(allureDir, '1-result.json'), 'utf-8'))
        expect(result.steps).toEqual([])
    })

    it('does not throw when another worker deletes its placeholder while this worker reads the folder', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-exit-'))
        dirs.push(dir)
        const allureDir = path.join(dir, 'allure')
        fs.mkdirSync(allureDir)
        const video = path.join(dir, 'my-video.webm')
        fs.writeFileSync(video, Buffer.alloc(2048, 1))
        fs.writeFileSync(path.join(allureDir, 'mine-attachment.webm'), video)
        fs.writeFileSync(path.join(allureDir, 'other-attachment.webm'), '/other/worker/video.webm')

        const reporter = new VideoReporter({ videoRenderTimeout: 200 })
        reporter.onRunnerStart({
            isMultiRemote: false,
            sessionId: '1',
            config: { outputDir: dir },
            instanceOptions: { 1: { reporters: [['allure', { outputDir: allureDir }]] } }
        } as never)
        reporter.videos.push(video)
        reporter.allureVideos.push(video)

        // the other worker deletes its placeholder after this worker listed the folder
        const statSync = fs.statSync
        const spy = vi.spyOn(fs, 'statSync').mockImplementation(((file: fs.PathLike, options?: never) => {
            if (String(file).endsWith('other-attachment.webm')) {
                fs.rmSync(file, { force: true })
            }
            return statSync(file, options)
        }) as typeof fs.statSync)
        try {
            expect(() => reporter.onExit()).not.toThrow()
        } finally {
            spy.mockRestore()
        }
        // this worker still puts its video into its own attachment
        expect(fs.statSync(path.join(allureDir, 'mine-attachment.webm')).size).toBe(2048)
    })
})
