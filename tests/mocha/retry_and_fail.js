import assert from 'assert'

describe('always fail', function () {
    it('always fail', function () {
        assert.equal(typeof this.retries, 'number')
        throw Error('Deliberate error.')
    })
})
