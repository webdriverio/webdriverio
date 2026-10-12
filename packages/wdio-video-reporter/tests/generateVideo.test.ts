import { describe, it, expect, vi } from 'vitest'
import VideoReporter from '../src/index.js'

const ffmpeg = vi.hoisted(() => ({ exitCode: 0, stderr: '' }))

vi.mock('node:child_process', async () => {
    const { EventEmitter } = await import('node:events')
    return {
        spawn: vi.fn(() => {
            const cp = Object.assign(new EventEmitter(), { stderr: new EventEmitter(), kill: vi.fn() })
            setTimeout(() => {
                cp.stderr.emit('data', Buffer.from(ffmpeg.stderr))
                cp.emit('close', ffmpeg.exitCode)
            }, 10)
            return cp
        })
    }
})

vi.mock('node:fs', () => {
    const mod = { writeFileSync: vi.fn(), mkdirSync: vi.fn(), existsSync: vi.fn().mockReturnValue(false) }
    return { ...mod, default: mod }
})

vi.mock('glob', () => ({ glob: () => Promise.resolve([]) }))

vi.mock('@ffmpeg-installer/ffmpeg', () => ({ path: '/foo/bar/ffmpeg' }))

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

const render = async () => {
    const reporter = new VideoReporter({})
    reporter.testName = 'my-test'
    reporter.recordingPath = '/foo/bar/rawSeleniumVideoGrabs/my-test'
    await reporter.generateVideo()
    return vi.mocked(reporter.write).mock.calls.map(([line]) => String(line)).join('')
}

describe('generateVideo', () => {
    it('logs the generated video when ffmpeg ends without an error', async () => {
        ffmpeg.exitCode = 0
        ffmpeg.stderr = ''
        expect(await render()).toContain('Generated video: ')
    })

    it('logs the error of a failed ffmpeg run, not a generated video', async () => {
        ffmpeg.exitCode = 1
        ffmpeg.stderr = 'some output\nUnknown encoder \'libvpx\''
        const log = await render()
        expect(log).not.toContain('Generated video: ')
        expect(log).toContain('ffmpeg failed with exit code 1')
        expect(log).toContain('Unknown encoder \'libvpx\'')
    })
})
