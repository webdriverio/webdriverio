const assert = require('assert')

describe('My awesome feature', () => {
    it('should can do something', () => {
        browser.url('http://google.com')

        const title = driver.getTitle()
        assert.equal(title, 'Google')

        console.log(title) // eslint-disable-line
    })
})
