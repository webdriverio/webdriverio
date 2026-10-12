import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, it, expect, vi, afterEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import VideoReporter from '../src/index.js'

vi.mock('../src/helpers.js', async (importOriginal) => ({
    ...await importOriginal<typeof HelpersModule>(),
    findFfmpeg: vi.fn(() => '/foo/bar/ffmpeg'),
    sleep: vi.fn()
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

describe('onExit', () => {
    const dirs: string[] = []
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
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
})
