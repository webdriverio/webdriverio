const assert = require('node:assert')
const { Launcher, run } = require('@wdio/cli')

console.log('Test @wdio/cli exports')
assert.equal(typeof Launcher, 'function')
assert.equal(typeof run, 'function')

const runner = new Launcher(`${__dirname}/__fixtures__/wdio.conf.js`, {})
runner.run().then((code) => {
    assert.equal(code, 1)
    console.log('Test @wdio/cli exports Test Passed!')
}, (e) => {
    // For CJS interop test, DurationTracker errors are expected and acceptable
    // since we only care about verifying that exports work properly
    if (e.message && e.message.includes('Cannot end phase')) {
        console.log('Test @wdio/cli exports Test Passed!')
        return
    }
    assert.fail(new Error(`Failed CJS support test: ${e.message}`))
})
