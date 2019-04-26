//var assert = require('assert')
import { Given } from 'cucumber'

Given('I go on the website {string}', (url) => {
    browser.cucumberScenario()
    browser.url(url)
})
