const { config } = require('./config')

exports.config = Object.assign({}, config, {
    beforeSuite () {
        browser.sharedStore.set(browser.sessionId, browser.capabilities)
    },
    services: [...config.services, 'shared-store']
})
