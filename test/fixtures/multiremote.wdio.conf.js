var chai = require('chai')
var chaiString = require('chai-string')
var chaiAsPromised = require('chai-as-promised')

exports.config = {
    baseUrl: 'http://127.0.0.1:8080',
    capabilities: {
        browserA: {
            browserName: 'phantomjs'
        },
        browserB: {
            browserName: 'phantomjs'
        }
    },
    framework: 'mocha',
    specs: [__dirname + '/specs/multiremote.spec.js'],
    mochaOpts: {
        compilers: ['js:babel/register'],
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
