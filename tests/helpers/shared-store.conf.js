const { config } = require('./config')

const conf = Object.assign({}, config, {
    beforeSuite () {
        browser.sharedStore.set(browser.sessionId, browser.capabilities)
    },
})
conf.services.push('shared-store')

exports.config = conf
