var chai = require('chai')
var chaiString = require('chai-string')
var chaiAsPromised = require('chai-as-promised')

exports.config = {
    specs: [],
    suites: {
        elementAsFirstCitizen: [__dirname + '/specs/element.spec.js'],
        waitForExist: [__dirname + '/specs/waitForExist.spec.js']
    },
    capabilities: [{
        browserName: 'phantomjs'
    }],
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
