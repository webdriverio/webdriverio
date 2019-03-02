const assert = require('assert')
const { Given, When, Then } = require('cucumber')

Given('I go on the website {string}', {wrapperOptions: {retry: 2}}, function (url) {
    return browser.url(url)
})

When('I click on link {string}', function (selector) {
    return browser.click(selector)
})

Then('should the title of the page be {string}', function (expectedTitle) {
    return browser.getTitle().then((title) => {
        assert.equal(title, expectedTitle)
    })
})
