const { config } = require('./config')

exports.config = Object.assign({}, config, {
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
