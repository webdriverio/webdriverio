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
        browser.assertExecutingFeatureFileOnce = (name) => {
            if (name !== specFileName) {
                console.error(new Error(`Cucumber executed the wrong feature file! Expected: ${specFileName} Got: ${name}`))
                process.exit(1)
            }
            if (global[`Cucumber_Ran_${name}`]) {
                console.error(new Error(`Cucumber executed feature file ${name} more than once!`))
                process.exit(1)
            }
            global[`Cucumber_Ran_${name}`] = true
        }
    },
})
