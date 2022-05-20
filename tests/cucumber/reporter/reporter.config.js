const path = require('node:path')
const { config } = require('../../helpers/config')

const reporterConfig = Object.assign({}, config, {
    framework: 'cucumber',
    reporters: [['smoke-test', { foo: 'bar' }]]
})

reporterConfig.cucumberOpts.require = [path.join(__dirname, 'reporter.given.js')]

exports.config = reporterConfig
