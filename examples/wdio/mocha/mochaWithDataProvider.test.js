const assert = require('assert')

describe(`${testData.url} page`, () => {
    it('should be a pending test')

    it('should have the right title', () => {
        browser.url(testData.url)
        const title = browser.getTitle()
        assert.equal(title, testData.title)
    })
})
