var chai = require('chai')
var chaiString = require('chai-string')
var chaiAsPromised = require('chai-as-promised')

const CUSTOM_COMMANDS = {
    'elementsCount': function async (selector) {
        return new Promise((resolve, reject) => {
            this.elements(selector).then((res) => {
                if (!res || res.status === -1) {
                    reject()
                }
                resolve(res.value.length)
            })
        })
    }
}

exports.config = {
    specs: [__dirname + '/specs/custom.commands.spec.js'],
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

        Object.keys(CUSTOM_COMMANDS).forEach((command) =>
            browser.addCommand(command, CUSTOM_COMMANDS[command]))

        chaiAsPromised.transferPromiseness = browser.transferPromiseness
    }
}
