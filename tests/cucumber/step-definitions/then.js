var assert = require('assert')
import { Then } from 'cucumber'

Then('I click on link {string}', (selector) => {
    $(selector).click()
})

Then('the title of the page should be {string}', (expectedTitle) => {
    browser.titleResponse(expectedTitle)
    const actualTitle = browser.getTitle()
    assert.equal(actualTitle, expectedTitle)
})
