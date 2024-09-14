import path from 'node:path'
import url from 'node:url'
import { config as baseConfig } from './config.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 5000,
        require: [path.resolve(__dirname, '..', 'cucumber', 'features', 'features.given.js')]
    },
    before: (capabilities, specs, browser) => {
        const specFileName = path.basename(specs[0])
        browser.assertExecutingFeatureFile = (name) => {
            if (name !== specFileName) {
                console.error(new Error(`Cucumber executed the wrong feature file! Expected: ${specFileName} Got: ${name}`))
                process.exit(1)
            }
        }
    },
})
