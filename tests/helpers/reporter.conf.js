const path = require('node:path')

const { config } = require('./config')
const reporter = require('../../packages/wdio-smoke-test-reporter')

exports.config = Object.assign({}, config, {
    reporters: ['spec', reporter.default],
    specs: [path.resolve(__dirname, '..', 'mocha', 'reporter.js')],
})
