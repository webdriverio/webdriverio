import { config as base } from './config.js'

export const config = {
    ...base,
    before(capabilities, _specs, browser) {
        // The driver is mocked; vary only the reported capability metadata.
        browser.capabilities.browserName = capabilities.browserName
    }
}
