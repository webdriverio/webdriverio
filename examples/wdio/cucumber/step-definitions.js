/**
 * to run these tests you need install Cucumber.js on your machine
 * take a look at https://github.com/cucumber/cucumber-js for more informations
 *
 * first, install Cucumber.js via NPM
 * $ npm install -g cucumber
 *
 * then go into the cucumber directory and start the tests with
 * $ cucumber.js
 */

var assert = require('assert')
const { Given, When, Then } = require('cucumber')

Given(/^I go on the website "([^"]*)"$/, (url) => {
    browser.url(url)
})

When(/^I add the following grocieries$/, (table) => {
    const newTodo = $('.new-todo')
    table.rawTable.shift()

    for (const [item, amount] of table.rawTable) {
        newTodo.click()
        browser.keys(`${item} (${amount}x)`)
        browser.keys('Enter')
        browser.pause(100) // for demo purposes
    }
})

Then(/^should the element "([^"]*)" be (\d+)px wide and (\d+)px high$/, (selector, width, height) => {
    var elemSize = $(selector).getSize()
    assert.equal(elemSize.width, width, `width of element is ${elemSize.width} but should be ${width}`)
    assert.equal(elemSize.height, height, `height of element is ${elemSize.height} but should be ${height}`)
})

Then(/^should the title of the page be "([^"]*)"$/, (expectedTitle) => {
    var title = browser.getTitle()
    assert.equal(title, expectedTitle, `Title is "${title}" but should be "${expectedTitle}"`)
})

Then(/^I should have a list of (\d+) items$/, (items) => {
    const listAmount = $$('.todo-list li').length
    assert.equal(items, listAmount, `Didn't found expected amount of items (${items}) in the list`)
})
