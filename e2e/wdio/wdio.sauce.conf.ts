import url from 'node:url'
import path from 'node:path'
import { config as baseConfig } from './wdio.conf.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    ...baseConfig,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,

    /**
     * Sauce specific config
     */
    specs: [path.resolve(__dirname, 'cloud', '*.e2e.ts')],
    capabilities: [{
        browserName: 'Chrome',
        browserVersion: 'latest',
        platformName: 'Windows 10',
        'sauce:options': {
            name: 'WebdriverIO Connection Test'
        }
    }]
}
