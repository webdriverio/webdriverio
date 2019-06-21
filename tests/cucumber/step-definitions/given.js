// eslint-disable-next-line
import assert from 'assert'
import { Given } from 'cucumber'

Given('I choose the {string} scenario', { retry: { wrapperOptions: { retry: 1 } } }, (scenario) => {
    if (typeof browser[scenario] !== 'function') {
        throw new Error(`Scenario with name "${scenario}" is not defined`)
    }

    browser[scenario]()
})

Given('I go on the website {string}', (url) => {
    browser.url(url)
})

Given('I click on link {string}', (selector) => {
    const elem = browser.$(selector)
    elem.click()
})

Given('I click on link {string} async', async (selector) => {
    const elem = await browser.$(selector)
    await elem.click()
})

Given(/^a table step$/, function(table) {
    const expected = [
        ['Apricot', '5'],
        ['Brocolli', '2'],
        ['Cucumber', '10']
    ]
    assert.deepEqual(table.rows(), expected)
})
