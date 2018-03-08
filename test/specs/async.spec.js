const assert = require('assert')

describe('My awesome feature', () => {
    it('should can do something', async () => {
        await browser.url('http://google.com')
        assert.equal(await browser.getTitle(), 'Google')
    })
})
