const assert = require('node:assert')
const CucumberJsJsonReporter = require('@wdio/cucumberjs-json-reporter')
const { attach } = require('@wdio/cucumberjs-json-reporter')

console.log('Test CucumberJS JSON Reporter Exports')
assert.equal(typeof attach, 'function')
assert.equal(typeof CucumberJsJsonReporter.attach, 'function')
console.log('CucumberJS JSON Reporter CJS Test Passed!')
