import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    beforeSuite () {
        browser.sharedStore.set(browser.sessionId, browser.capabilities)
    },
    services: [...baseConfig.services, 'shared-store']
})
