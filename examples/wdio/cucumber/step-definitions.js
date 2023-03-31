/**
 * to run these tests you need install Cucumber.js on your machine
 * take a look at https://github.com/cucumber/cucumber-js for more information
 *
 * first, install Cucumber.js via NPM
 * $ npm install -g cucumber
 *
 * then go into the cucumber directory and start the tests with
 * $ cucumber.js
 */

const { Given, When, Then } = require('@cucumber/cucumber')
// eslint-disable-next-line import/extensions
const { Key } = require('../../../packages/webdriverio')

Given(/^I go on the website "([^"]*)"$/, async (url) => {
    await browser.url(url)
})

When(/^I add the following groceries$/, async (table) => {
    const newTodo = await $('.new-todo')
    table.rawTable.shift()

    for (const [item, amount] of table.rawTable) {
        await newTodo.addValue(`${item} (${amount}x)`)
        await browser.keys(Key.Enter)
        await browser.pause(100) // for demo purposes
    }
})

Then(/^should the element "([^"]*)" be (\d+)px wide and (\d+)px high$/, async (selector, width, height) => {
    const elemSize = await $(selector).getSize()
    expect(elemSize.width).toBe(width)
    expect(elemSize.height).toBe(height)
})

Then(/^should the title of the page be "([^"]*)"$/, async (expectedTitle) => {
    await expect(browser).toHaveTitle(expectedTitle)
})

Then(/^I should have a list of (\d+) items$/, async (items) => {
    await expect($$('.todo-list li')).toBeElementsArrayOfSize(items)
})
