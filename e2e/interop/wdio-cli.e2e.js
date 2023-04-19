const assert = require('node:assert')
const { Launcher, run } = require('../../packages/wdio-cli')

console.log('Test @wdio/cli exports')
assert.equal(typeof Launcher, 'function')
assert.equal(typeof run, 'function')
console.log('Test @wdio/cli exports Test Passed!')
