import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import type { Server } from 'node:http'

import { COLORS, startColorServer } from './colorServer.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const resultsDir = path.join(__dirname, 'results', 'parallel')
const videoDir = path.join(resultsDir, 'videos')
const rawDir = path.join(videoDir, '.video-reporter-screenshots')
const allureDir = path.join(resultsDir, 'allure')
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
let server: Server | undefined

/**
 * Real-browser check of `@wdio/video-reporter` in Mocha parallel mode:
 * `pnpm run test:e2e:video-reporter:parallel`. The 4 tests run at the same time. The
 * run fails in `onComplete` when a test has no video, when a frame shows the page
 * of another test, or when an Allure video is not the video of its test.
 */
export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, 'video.parallel.e2e.ts')],
    capabilities: [{
        browserName: 'chrome',
        'wdio:experimentalBiDiCommands': true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],
    logLevel: 'info',
    framework: 'mocha',
    outputDir: resultsDir,
    reporters: [
        'spec',
        ['video', { saveAllVideos: true, outputDir: videoDir }],
        ['allure', {
            outputDir: allureDir,
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: true
        }]
    ],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        parallelMode: 'contexts',
        maxParallelContexts: 4
    },

    async onPrepare () {
        fs.rmSync(videoDir, { recursive: true, force: true })
        fs.rmSync(allureDir, { recursive: true, force: true })
        const color = await startColorServer()
        server = color.server
        // the workers start after onPrepare and get this environment
        process.env.VIDEO_COLOR_ORIGIN = color.origin
    },

    onComplete () {
        server?.close()
        const errors: string[] = []
        const slug = (title: string) => title.replace(/ /g, '-')
        const colorOf = (frame: string) => execFileSync(ffmpeg, ['-v', 'error', '-i', frame, '-vf', 'crop=1:1:iw/2:ih/2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
        const near = (rgb: Buffer, hex: string) => [0, 2, 4].every((i, n) => Math.abs(rgb[n] - parseInt(hex.slice(i, i + 2), 16)) < 30)
        const md5 = (file: string) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex')

        const videos = fs.existsSync(videoDir) ? fs.readdirSync(videoDir).filter((file) => file.endsWith('.webm')) : []
        const recordings = fs.existsSync(rawDir) ? fs.readdirSync(rawDir) : []
        for (const [test, colors] of Object.entries(COLORS)) {
            const ownVideos = videos.filter((video) => video.startsWith(`${slug(test)}-`))
            if (ownVideos.length !== 1) {
                errors.push(`"${test}" has ${ownVideos.length} videos (found: ${videos.join(', ') || 'none'})`)
            }
            for (const recording of recordings.filter((name) => name.startsWith(`${slug(test)}-`))) {
                const frames = fs.readdirSync(path.join(rawDir, recording)).filter((file) => file.endsWith('.png'))
                // another color is the page of another test (white: a window before its first page)
                const foreign = frames.filter((frame) => {
                    const rgb = colorOf(path.join(rawDir, recording, frame))
                    return ![...colors, 'ffffff'].some((hex) => near(rgb, hex))
                })
                if (!frames.length || foreign.length) {
                    errors.push(`"${test}": ${frames.length} frames, ${foreign.length} with the page of another test (${foreign.join(', ')})`)
                }
            }
        }

        const results = fs.existsSync(allureDir)
            ? fs.readdirSync(allureDir)
                .filter((file) => file.endsWith('-result.json'))
                .map((file) => JSON.parse(fs.readFileSync(path.join(allureDir, file), 'utf-8')))
            : []
        type AllureItem = { attachments?: { type: string, source: string }[], steps?: AllureItem[] }
        const attachmentsOf = (item: AllureItem): { type: string, source: string }[] => [
            ...(item.attachments ?? []),
            ...(item.steps ?? []).flatMap(attachmentsOf)
        ]
        for (const test of Object.keys(COLORS)) {
            const result = results.find((r) => r.name === test)
            const attachment = result && attachmentsOf(result).find((a) => a.type === 'video/webm')
            const video = videos.find((file) => file.startsWith(`${slug(test)}-`))
            if (!attachment || !video || !fs.existsSync(path.join(allureDir, attachment.source))) {
                errors.push(`no Allure video for "${test}"`)
            } else if (md5(path.join(allureDir, attachment.source)) !== md5(path.join(videoDir, video))) {
                errors.push(`the Allure video of "${test}" is not its video`)
            }
        }

        if (errors.length) {
            console.error(`Video reporter parallel e2e check failed:\n  - ${errors.join('\n  - ')}`)
            throw new Error('Video reporter parallel e2e check failed')
        }
        console.log(`Video reporter parallel e2e check passed: ${videos.length} videos, ${results.length} Allure results`)
    }
}
