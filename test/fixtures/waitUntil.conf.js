var path = require('path')
var chai = require('chai')

exports.config = {
    specs: [],
    suites: {
        sync: [path.join(__dirname, '/specs/waitUntil.spec.js')],
        async: [path.join(__dirname, '/specs/waitUntil.async.spec.js')]
    },
    capabilities: [{
        browserName: 'phantomjs'
    }],
    mochaOpts: {
        compilers: ['js:babel-register'],
        timeout: 60000
    },
    before: function () {
        chai.should()
        global.assert = chai.assert
        global.expect = chai.expect
    }
}
