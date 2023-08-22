const assert = require('node:assert')
const WdioReporter = require('../../packages/wdio-reporter')

console.log('Test Shared Store exports')
assert.equal(typeof WdioReporter, 'function')
console.log('Test Shared Store exports Test Passed!')
