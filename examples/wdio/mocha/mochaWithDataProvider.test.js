const assert = require('assert')

describe(`${testData.url} page`, () => {

    it('should match title from data provider', () => {
        browser.url(testData.url)
        const title = browser.getTitle()
        assert.equal(title, testData.title)
    })
})
