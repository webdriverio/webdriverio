var assert = require('assert')
var { Given, Then } = require('cucumber')

global.syncAsync = {}

Given('I go on the website {string}', (url) => {
    browser.url(url)
})

Then('I click on link {string}', (selector) => {
    browser.click(selector)
})

Then('should the title of the page be {string}', (expectedTitle) => {
    assert.equal(browser.getTitle(), expectedTitle)
})

Given('I go on the website {string} the async way', function async (url) {
    let promise = browser.url(url)

    assert.equal(typeof promise.then, 'function')

    return promise
})

Then('I click on link {string} the async way', function async (selector) {
    let promise = browser.click(selector)
    assert.equal(typeof promise.then, 'function')
    return promise
})

Then('should the title of the page be {string} the async way', function async (expectedTitle) {
    return browser.getTitle().then((title) => {
        assert.equal(title, expectedTitle)
    })
})
