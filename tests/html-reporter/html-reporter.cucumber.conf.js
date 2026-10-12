import path from 'node:path'
import url from 'node:url'
import { config as htmlConfig } from './html-reporter.conf.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    ...htmlConfig,
    framework: 'cucumber',
    specs: [path.join(__dirname, 'html-reporter.feature')],
    cucumberOpts: {
        ...htmlConfig.cucumberOpts,
        require: [path.join(__dirname, 'html-reporter.steps.js')],
        retry: 1
    }
}
