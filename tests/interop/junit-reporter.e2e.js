const assert = require('node:assert')
const JUnitReporter = require('@wdio/junit-reporter')
const { addProperty } = require('@wdio/junit-reporter')

console.log('Test JUnit Reporter Exports')
assert.equal(typeof addProperty, 'function')
assert.equal(typeof JUnitReporter.addProperty, 'function')
console.log('JUnit Reporter CJS Test Passed!')
