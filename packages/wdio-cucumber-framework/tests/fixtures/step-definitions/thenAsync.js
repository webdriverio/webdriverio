var assert = require('assert')
import { Then } from 'cucumber'

Then('the title of the page should be {string}', async (expectedTitle) => {
    const actualTitle = await browser.getTitle()
    assert.equal(actualTitle, expectedTitle)
})
