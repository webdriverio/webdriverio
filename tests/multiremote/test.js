import assert from 'assert'

describe('smoke test multiremote', () => {
    it('should return sync value', () => {
        assert.equal(
            JSON.stringify(browser.getTitle()),
            JSON.stringify(['Mock Page Title', 'Mock Page Other Title']))
    })
})
