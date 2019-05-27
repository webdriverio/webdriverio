import { Given } from 'cucumber'

Given('I go on the website {string}', (url) => {
    browser.url(url)
})

Given('I click on link {string}', (selector) => {
    const elem = browser.$(selector)
    elem.click()
})
