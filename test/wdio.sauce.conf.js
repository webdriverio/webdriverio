const { config } = require('./wdio.conf')

exports.config = Object.assign(config, {
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY
})
