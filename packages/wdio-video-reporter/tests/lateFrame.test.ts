import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, it, expect, vi, afterEach } from 'vitest'
import type * as HelpersModule from '../src/helpers.js'
import VideoReporter from '../src/index.js'
import notAvailableImage from '../src/assets/notAvailableImage.js'

/**
 * a screenshot that ends after the frame timeout
 */
const late = vi.hoisted(() => ({ resolve: undefined as undefined | ((data: string) => void) }))

vi.mock('@wdio/globals', () => ({
    browser: {
        capabilities: { browserName: 'chrome' },
        on: vi.fn(),
        takeScreenshot: vi.fn(() => new Promise<string>((resolve) => { late.resolve = resolve }))
    }
}))

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

describe('a screenshot that ends after its timeout', () => {
    const dirs: string[] = []
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('does not write its frame again: ffmpeg can read the frame already', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-late-'))
        dirs.push(dir)
        const reporter = new VideoReporter({ videoRenderTimeout: 20 })
        reporter.recordingPath = dir
        reporter.addFrame()
        await Promise.all(reporter.screenshotPromises)
        const frame = path.join(dir, '0000.png')
        expect(fs.readFileSync(frame).toString('base64')).toBe(notAvailableImage)

        late.resolve!(Buffer.from('late screenshot').toString('base64'))
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(fs.readFileSync(frame).toString('base64')).toBe(notAvailableImage)
    })
})
