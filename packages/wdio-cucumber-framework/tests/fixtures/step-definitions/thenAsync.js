var assert = require('assert')
import { Then } from 'cucumber'

Then('the title of the page should be {string}', async (expectedTitle) => {
    browser.titleResponse(expectedTitle)
    const actualTitle = await browser.getTitle()
    assert.equal(actualTitle, expectedTitle)
})
