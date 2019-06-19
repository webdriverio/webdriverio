// eslint-disable-next-line
import { Given } from 'cucumber'

Given('I choose the {string} scenario', (scenario) => {
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
