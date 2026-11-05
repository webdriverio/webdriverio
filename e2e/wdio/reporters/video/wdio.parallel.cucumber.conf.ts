import url from 'node:url'
import path from 'node:path'

import { config as mochaConfig } from './wdio.parallel.conf.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * The checks of `wdio.parallel.conf.ts` in Cucumber parallel mode: one video for each
 * scenario, no frame of another scenario, and each Allure video is the video of its scenario.
 */
export const config: WebdriverIO.Config = {
    ...mochaConfig,
    specs: [path.join(__dirname, 'video.parallel.feature')],
    framework: 'cucumber',
    cucumberOpts: {
        require: [path.join(__dirname, 'video.parallel.steps.ts')],
        timeout: 60000,
        parallelMode: 'contexts',
        maxParallelContexts: 4
    }
}
