import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    async beforeCommand () {
        await browser.pause(100)
    },
    async afterCommand () {
        await browser.pause(100)
    },
    afterTest () {
        throw new Error('I should not cause problems')
    }
})
