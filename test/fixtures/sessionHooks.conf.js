const path = require('path')
const chai = require('chai')

exports.config = {
    specs: [
        path.join(__dirname, 'specs', 'hooks.js')
    ],
    capabilities: [{
        browserName: 'phantomjs'
    }],
    beforeSession: (config, caps, specs) => {
        global.expect = chai.expect
        config.foobar = 'foobar'
        caps.someOption = 'test123'

        const start = Date.now()
        return new Promise((resolve, reject) => setTimeout(() => {
            global.beforeSessionExecutionTime = Date.now() - start
            reject(new Error('booo'))
        }, 500))
    },
    afterSession: [
        () => {
            return new Promise((resolve) => setTimeout(resolve, 5000))
        },
        () => {
            throw new Error('nothing should happen')
        }
    ]
}
