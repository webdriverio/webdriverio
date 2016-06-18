var chai = require('chai')

exports.config = {
    specs: [],
    suites: {
        sync: [__dirname + '/specs/waitUntil.spec.js'],
        async: [__dirname + '/specs/waitUntil.async.spec.js']
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
        global.assert = chai.assert
        global.expect = chai.expect
    }
}
