const assert = require('node:assert')
const path = require('node:path')

describe('a cjs test file', () => {
    it('should pass', () => {
        assert.equal(path.basename(__filename), 'test-cjs.js')
    })
})
