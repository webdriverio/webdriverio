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
    expect(elemSize.width).toBe(width)
    expect(elemSize.height).toBe(height)
})

Then(/^should the title of the page be "([^"]*)"$/, (expectedTitle) => {
    expect(browser).toHaveTitle(expectedTitle)
})

Then(/^I should have a list of (\d+) items$/, (items) => {
    expect($$('.todo-list li')).toBeElementsArrayOfSize(items)
})
