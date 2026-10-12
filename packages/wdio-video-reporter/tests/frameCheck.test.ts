import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'

import { describe, it, expect, vi, afterEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import VideoReporter from '../src/index.js'

/**
 * the frames that ffmpeg reads: their content when ffmpeg starts
 */
const ffmpeg = vi.hoisted(() => ({ frames: {} as Record<string, string> }))

vi.mock('node:child_process', async () => {
    const fsModule = await import('node:fs')
    const { EventEmitter: Emitter } = await import('node:events')
    return {
        spawn: vi.fn((_command: string, args: string[]) => {
            const dir = path.dirname(args[args.indexOf('-i') + 1])
            for (const file of fsModule.readdirSync(dir)) {
                ffmpeg.frames[file] = fsModule.readFileSync(path.join(dir, file), 'utf-8')
            }
            const cp = Object.assign(new Emitter(), { stderr: new Emitter() })
            setTimeout(() => cp.emit('close', 0))
            return cp
        })
    }
})

/**
 * the glob lists the folder when it is called, and answers a little later
 */
vi.mock('glob', async () => {
    const fsModule = await import('node:fs')
    return {
        glob: vi.fn((pattern: string) => {
            const dir = path.dirname(pattern)
            const files = fsModule.readdirSync(dir).filter((file) => file.endsWith('.png')).sort().map((file) => `${dir}/${file}`)
            return new Promise((resolve) => setTimeout(() => resolve(files), 10))
        })
    }
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

vi.mock('@wdio/globals', () => ({ browser: { capabilities: { browserName: 'chrome' }, on: vi.fn() } }))

describe('frames that end after the end of the test', () => {
    const dirs: string[] = []
    afterEach(() => {
        ffmpeg.frames = {}
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    const setup = (doneFrames: number[]) => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-frames-'))
        dirs.push(dir)
        const reporter = new VideoReporter({ videoRenderTimeout: 1000 })
        reporter.testName = 'test'
        reporter.recordingPath = dir
        for (const frame of doneFrames) {
            fs.writeFileSync(path.join(dir, `${String(frame).padStart(4, '0')}.png`), `frame ${frame}`)
        }
        /**
         * a screenshot that is still pending: it writes its frame when `end()` is called
         */
        const pending = (frame: number) => {
            let end!: () => void
            reporter.screenshotPromises.push(new Promise<void>((resolve) => {
                end = () => {
                    fs.writeFileSync(path.join(dir, `${String(frame).padStart(4, '0')}.png`), `frame ${frame}`)
                    resolve()
                }
            }))
            return () => end()
        }
        return { reporter, pending }
    }

    it('does not overwrite a frame that ends while the frames are checked', async () => {
        const { reporter, pending } = setup([0, 1, 3])
        const endFrame2 = pending(2)

        const video = reporter.generateVideo()
        endFrame2()
        await video

        expect(ffmpeg.frames['0002.png']).toBe('frame 2')
    })

    it('makes the video when the first frames end after the test', async () => {
        const onUnhandled = vi.fn()
        process.on('unhandledRejection', onUnhandled)
        try {
            const { reporter, pending } = setup([0, 3])
            const endFrame1 = pending(1)
            const endFrame2 = pending(2)

            const video = reporter.generateVideo()
            await new Promise((resolve) => setTimeout(resolve, 50))
            endFrame1()
            endFrame2()
            await video

            expect(onUnhandled).not.toHaveBeenCalled()
            expect(ffmpeg.frames).toEqual({
                '0000.png': 'frame 0',
                '0001.png': 'frame 1',
                '0002.png': 'frame 2',
                '0003.png': 'frame 3',
            })
            expect(reporter.videos).toHaveLength(1)
        } finally {
            process.off('unhandledRejection', onUnhandled)
        }
    })
})
