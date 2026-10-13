import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { describe, it, expect, vi } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import VideoReporter from '../src/index.js'

const ffmpeg = vi.hoisted(() => ({ exitCode: 0, stderr: '', spawnError: undefined as Error | undefined, hang: false }))

vi.mock('node:child_process', async () => {
    const { EventEmitter } = await import('node:events')
    return {
        spawn: vi.fn(() => {
            const cp = Object.assign(new EventEmitter(), { stderr: new EventEmitter(), kill: vi.fn() })
            setTimeout(() => {
                // a render that does not end (until the reporter kills it)
                if (ffmpeg.hang) {
                    return
                }
                if (ffmpeg.spawnError) {
                    cp.emit('error', ffmpeg.spawnError)
                    return
                }
                cp.stderr.emit('data', Buffer.from(ffmpeg.stderr))
                cp.emit('close', ffmpeg.exitCode)
            }, 10)
            return cp
        })
    }
})

vi.mock('node:fs', () => {
    const mod = { writeFileSync: vi.fn(), mkdirSync: vi.fn(), existsSync: vi.fn().mockReturnValue(false), rmSync: vi.fn() }
    return { ...mod, default: mod }
})

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

vi.mock('@wdio/allure-reporter', () => ({ addAttachment: vi.fn(), addArgument: vi.fn() }))

vi.mock('@wdio/globals', () => ({ browser: { capabilities: { browserName: 'chrome' }, on: vi.fn() } }))

const render = async (recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test', options = {}) => {
    const reporter = new VideoReporter(options)
    reporter.testName = 'my-test'
    reporter.recordingPath = recordingPath
    await reporter.generateVideo()
    return vi.mocked(reporter.write).mock.calls.map(([line]) => String(line)).join('')
}

describe('generateVideo', () => {
    it('logs the generated video when ffmpeg ends without an error', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        expect(await render()).toContain('Generated video: ')
    })

    it('adds no frame to a recording after its render starts (for example from an afterEach hook)', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        const reporter = new VideoReporter({})
        reporter.testName = 'my-test'
        reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
        const video = reporter.generateVideo()
        const frame = reporter.frameNr
        expect(reporter.addFrame()).toBe(false)
        expect(reporter.frameNr).toBe(frame)
        await video
    })

    it('uses webm for a videoFormat that it does not support', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        vi.mocked(spawn).mockClear()
        await expect(render(undefined, { videoFormat: 'mov' })).resolves.toContain('Generated video: ')
        const [, args] = vi.mocked(spawn).mock.calls[0] as unknown as [string, string[]]
        expect(args[args.length - 1]).toMatch(/\.webm$/)
        expect(args).toContain('libvpx-vp9')
    })

    it('drops the video of a render that it kills at the timeout, at once', async () => {
        ffmpeg.hang = true
        try {
            vi.mocked(spawn).mockClear()
            vi.mocked(fs.rmSync).mockClear()
            const reporter = new VideoReporter({ videoRenderTimeout: 30 })
            reporter.testName = 'my-test'
            reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
            void reporter.generateVideo()
            await new Promise((resolve) => setTimeout(resolve, 5))
            const [videoPath] = reporter.videos
            reporter.onRunnerEnd()
            await new Promise((resolve) => setTimeout(resolve, 60))
            expect(reporter.isSynchronised).toBe(true)
            // the worker can exit now: the partial file must not be kept as a video
            expect(reporter.videos).toEqual([])
            expect(fs.rmSync).toHaveBeenCalledWith(videoPath, { force: true })
        } finally {
            ffmpeg.hang = false
        }
    })

    it('ends when the killed render still holds its file (Windows EBUSY)', async () => {
        ffmpeg.hang = true
        const onUncaught = vi.fn()
        // the abort runs in a timer: a throw there is an uncaught exception
        const listeners = process.listeners('uncaughtException')
        process.removeAllListeners('uncaughtException')
        process.on('uncaughtException', onUncaught)
        try {
            vi.mocked(fs.rmSync).mockImplementationOnce(() => {
                throw Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })
            })
            const reporter = new VideoReporter({ videoRenderTimeout: 30 })
            reporter.testName = 'my-test'
            reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
            void reporter.generateVideo()
            await new Promise((resolve) => setTimeout(resolve, 5))
            reporter.onRunnerEnd()
            await new Promise((resolve) => setTimeout(resolve, 60))
            expect(onUncaught).not.toHaveBeenCalled()
            expect(reporter.isSynchronised).toBe(true)
            // the partial file is not a video of the report
            expect(reporter.videos).toEqual([])
        } finally {
            ffmpeg.hang = false
            process.off('uncaughtException', onUncaught)
            listeners.forEach((listener) => process.on('uncaughtException', listener))
        }
    })

    it('waits only for the frames of its own recording', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        const reporter = new VideoReporter({})
        reporter.testName = 'my-test'
        reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
        reporter.screenshotPromises.push(Promise.resolve())
        const video = reporter.generateVideo()
        // the next recording starts with no frame to wait for
        expect(reporter.screenshotPromises).toEqual([])
        await video
    })

    it('logs the error of a failed ffmpeg run, not a generated video', async () => {
        ffmpeg.exitCode = 1
        ffmpeg.stderr = 'some output\nUnknown encoder \'libvpx\''
        const log = await render()
        expect(log).not.toContain('Generated video: ')
        expect(log).toContain('ffmpeg failed with exit code 1')
        expect(log).toContain('Unknown encoder \'libvpx\'')
    })

    it('starts ffmpeg without a shell, with the paths as they are', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        vi.mocked(spawn).mockClear()
        const recordingPath = '/foo/a "quoted" $HOME folder/my-test'
        await render(recordingPath)

        const [command, args, options] = vi.mocked(spawn).mock.calls[0] as unknown as [string, string[], { shell?: boolean }]
        expect(command).toBe('/foo/bar/ffmpeg')
        expect(options.shell).toBeFalsy()
        expect(args).toContain(`${recordingPath}/%04d.png`)
        expect(args).toContain('scale=1200:trunc(ow/a/2)*2,setpts=3*PTS')
        expect(args.at(-1)).toMatch(/my-test\.webm$/)
        expect(args.some((arg) => arg.startsWith('"'))).toBe(false)
    })

    it('logs a ffmpeg that cannot start, and does not throw', async () => {
        ffmpeg.spawnError = Object.assign(new Error('spawn /foo/bar/ffmpeg ENOENT'), { code: 'ENOENT' })
        try {
            const log = await render()
            expect(log).toContain('could not start ffmpeg')
            expect(log).toContain('ENOENT')
        } finally {
            ffmpeg.spawnError = undefined
        }
    })

    it('accepts a videoSlowdownMultiplier that is not an integer', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        vi.mocked(spawn).mockClear()
        await render(undefined, { videoSlowdownMultiplier: 1.5 })
        const [, args] = vi.mocked(spawn).mock.calls[0] as unknown as [string, string[]]
        expect(args).toContain('scale=1200:trunc(ow/a/2)*2,setpts=1.5*PTS')
    })

    it('removes the file of a failed render, so it is not used as a video', async () => {
        ffmpeg.exitCode = 1
        ffmpeg.stderr = 'Error while parsing expression'
        vi.mocked(fs.rmSync).mockClear()
        const reporter = new VideoReporter({})
        reporter.testName = 'my-test'
        reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
        await reporter.generateVideo()
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringMatching(/my-test\.webm$/), { force: true })
        expect(reporter.videos).toEqual([])
    })
})
