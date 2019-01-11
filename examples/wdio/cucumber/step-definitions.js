
const Cucumber = require('cucumber')
const assert = require('assert')

Cucumber.Given(/^I go to the website "(.*)"$/, async (url) => {
    await browser.url(url)
})

Cucumber.Then(/^should the element "([^"]*)" have text "(.*)"$/, async (selector, expectedText) => {
    const text = await $(selector).then(el => el.getText())
    assert.equal(text, expectedText)
})

Cucumber.Then(/^should the title of the page be "([^"]*)"$/, async (expectedTitle) => {
    const title = await browser.getTitle()
    assert.equal(title, expectedTitle, ' title is "'+ title + '" but should be "'+ expectedTitle)
})
