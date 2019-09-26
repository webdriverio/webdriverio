const PROTOCOLS = {
    webdriver: require('../packages/wdio-protocols/protocols/webdriver.json'),
    appium: require('../packages/wdio-protocols/protocols/appium.json'),
    jsonwp: require('../packages/wdio-protocols/protocols/jsonwp.json'),
    mjsonwp: require('../packages/wdio-protocols/protocols/mjsonwp.json'),
    chromium: require('../packages/wdio-protocols/protocols/chromium.json'),
    saucelabs: require('../packages/wdio-protocols/protocols/saucelabs.json'),
    selenium: require('../packages/wdio-protocols/protocols/selenium.json')
}
const PROTOCOL_NAMES = {
    appium: 'Appium',
    jsonwp: 'JSON Wire Protocol',
    mjsonwp: 'Mobile JSON Wire Protocol',
    webdriver: 'Webdriver Protocol',
    chromium: 'Chromium',
    saucelabs: 'Sauce Labs',
    selenium: 'Selenium Standalone'
}
const MOBILE_PROTOCOLS = ['appium', 'mjsonwp']
const VENDOR_PROTOCOLS = ['chromium']
const IGNORED_SUBPACKAGES_FOR_DOCS = [
    'eslint-plugin-wdio',
    'wdio-smoke-test-service',
    'wdio-smoke-test-reporter',
    'wdio-webdriver-mock-service'
]

module.exports = {
    PROTOCOLS,
    PROTOCOL_NAMES,
    MOBILE_PROTOCOLS,
    VENDOR_PROTOCOLS,
    IGNORED_SUBPACKAGES_FOR_DOCS
}
