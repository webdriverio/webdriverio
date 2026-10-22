import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import type { Server } from 'node:http'

import { startColorServer } from './colorServer.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const framework = process.env.HTML_PARALLEL_FRAMEWORK === 'cucumber' ? 'cucumber' : 'mocha'
const resultsDir = path.join(__dirname, 'results', 'parallel', framework)
const htmlDir = path.join(resultsDir, 'html')
const shotsDir = path.join(resultsDir, 'shots')
const parallel = { parallelMode: 'contexts', maxParallelContexts: 4 } as const
let server: Server | undefined

/**
 * Parallel-mode run of `@wdio/html-reporter`, for Mocha or Cucumber
 * (`HTML_PARALLEL_FRAMEWORK`). Some tests fail on purpose, so `checkParallel.mjs`
 * starts this run and checks the report: `pnpm run test:e2e:html-reporter:parallel`.
 */
export const config: WebdriverIO.Config = {
    specs: framework === 'cucumber'
        ? [path.join(__dirname, 'parallel.feature')]
        : [path.join(__dirname, 'parallel.e2e.ts'), path.join(__dirname, 'parallelHooks.e2e.ts')],
    maxInstances: 1,
    capabilities: [{
        browserName: 'chrome',
        'wdio:experimentalBiDiCommands': true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],
    logLevel: 'info',
    framework,
    outputDir: resultsDir,
    reporters: ['spec', ['html', { outputDir: htmlDir, filename: 'report.html', useOnAfterCommandForScreenshot: true }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        ...parallel
    },
    cucumberOpts: {
        require: [path.join(__dirname, 'parallelSteps.ts')],
        timeout: 60000,
        ...parallel
    },

    async onPrepare () {
        fs.rmSync(htmlDir, { recursive: true, force: true })
        fs.rmSync(shotsDir, { recursive: true, force: true })
        fs.mkdirSync(shotsDir, { recursive: true })
        const color = await startColorServer()
        server = color.server
        // the workers start after onPrepare and get this environment
        process.env.HTML_COLOR_ORIGIN = color.origin
        process.env.HTML_SHOTS_DIR = shotsDir
    },

    onComplete () {
        server?.close()
    }
}
