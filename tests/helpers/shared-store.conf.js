import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    async beforeSuite () {
        await browser.sharedStore.setResourcePool('test-resource-pool', [1, 2, 3])
        await browser.sharedStore.set(browser.sessionId, browser.capabilities)
    },
    services: [...baseConfig.services, 'shared-store']
})
