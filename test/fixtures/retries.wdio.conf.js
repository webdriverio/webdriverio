const path = require('path')
const chai = require('chai')

exports.config = {
    specs: [path.join(__dirname, '/specs/retries.spec.js')],
    capabilities: [{
        browserName: 'phantomjs'
    }],
    mochaOpts: {
        compilers: ['js:babel-register'],
        timeout: 60000
    },
    specFileRetries: 1,
    before: () => {
        global.expect = chai.expect
    }
}
