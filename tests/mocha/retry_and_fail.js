import assert from 'node:assert'

describe('always fail', function () {
    it('always fail', function () {
        assert.equal(typeof this.wdioRetries, 'number')
        throw Error('Deliberate error.')
    })
})
