import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const resultsDir = path.join(__dirname, 'results')
const videoDir = path.join(resultsDir, 'videos')
const allureDir = path.join(resultsDir, 'allure')
const TESTS = ['records the commands of a test', 'records a second test']

/**
 * Real-browser check of `@wdio/video-reporter` with the Allure reporter in a
 * WebDriver BiDi session: `pnpm run test:e2e:video-reporter`. The run fails in
 * `onComplete` when a test has no video or no playable Allure video.
 */
export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, 'video.e2e.ts')],
    capabilities: [{
        browserName: 'chrome',
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
        timeout: 60000
    },

    /**
     * the launcher already writes its log into `resultsDir`
     */
    onPrepare () {
        fs.rmSync(videoDir, { recursive: true, force: true })
        fs.rmSync(allureDir, { recursive: true, force: true })
    },

    onComplete () {
        const errors: string[] = []
        const isFile = (file: string) => fs.existsSync(file) && fs.statSync(file).size > 0

        const videos = fs.existsSync(videoDir)
            ? fs.readdirSync(videoDir).filter((file) => file.endsWith('.webm'))
            : []
        for (const test of TESTS) {
            const prefix = test.replace(/ /g, '-')
            if (!videos.some((video) => video.startsWith(prefix) && isFile(path.join(videoDir, video)))) {
                errors.push(`no video for "${test}" in ${videoDir} (found: ${videos.join(', ') || 'none'})`)
            }
        }

        const results = fs.existsSync(allureDir)
            ? fs.readdirSync(allureDir)
                .filter((file) => file.endsWith('-result.json'))
                .map((file) => JSON.parse(fs.readFileSync(path.join(allureDir, file), 'utf-8')))
            : []
        /**
         * `addAttachment()` of the Allure reporter puts the video into a step of the test
         */
        type AllureItem = { attachments?: { type: string, source: string }[], steps?: AllureItem[] }
        const attachmentsOf = (item: AllureItem): { type: string, source: string }[] => [
            ...(item.attachments ?? []),
            ...(item.steps ?? []).flatMap(attachmentsOf)
        ]
        for (const test of TESTS) {
            const result = results.find((r) => r.name === test)
            const video = result && attachmentsOf(result).find((a) => a.type === 'video/webm')
            if (!video) {
                errors.push(`no Allure video attachment for "${test}"`)
            } else if (!isFile(path.join(allureDir, video.source))) {
                errors.push(`the Allure video of "${test}" is not a video file: ${video.source}`)
            }
        }

        if (errors.length) {
            console.error(`Video reporter e2e check failed:\n  - ${errors.join('\n  - ')}`)
            throw new Error('Video reporter e2e check failed')
        }
        console.log(`Video reporter e2e check passed: ${videos.length} videos, ${TESTS.length} Allure videos`)
    }
}
