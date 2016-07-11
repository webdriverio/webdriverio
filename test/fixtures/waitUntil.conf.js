var path = require('path')

var chai = require('chai')
var chaiString = require('chai-string')
var chaiAsPromised = require('chai-as-promised')

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
        chai.use(chaiString)
        chai.use(chaiAsPromised)
        global.assert = chai.assert
        global.expect = chai.expect
    }
}
