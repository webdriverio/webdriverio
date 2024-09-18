const assert = require('node:assert')
const JUnitReporter = require('@wdio/junit-reporter')
const { addProperty } = require('@wdio/junit-reporter')

console.log('Test JUnit Reporter Exports')
assert(typeof addProperty, 'function')
assert(typeof JUnitReporter.addProperty, 'function')
console.log('JUnit Reporter CJS Test Passed!')
