const assert = require('node:assert')
const { getValue, setValue } = require('../../packages/wdio-shared-store-service')

console.log('Test Shared Store exports')
assert.equal(typeof getValue, 'function')
assert.equal(typeof setValue, 'function')
console.log('Test Shared Store exports Test Passed!')
