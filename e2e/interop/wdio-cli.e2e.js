const assert = require('node:assert')
const { Launcher, run } = require('../../packages/wdio-cli')

console.log('Test @wdio/cli exports')
assert.equal(typeof Launcher, 'function')
assert.equal(typeof run, 'function')

const runner = new Launcher(`${__dirname}/__fixtures__/wdio.conf.js`, {})
runner.run().then((code) => {
    assert.equal(code, 1)
    console.log('Test @wdio/cli exports Test Passed!')
}, (e) => {
    assert.fail(new Error(`Failed CJS support test: ${e.message}`))
})
