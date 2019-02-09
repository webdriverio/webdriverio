const PROTOCOLS = {
    webdriver: require('../packages/webdriver/protocol/webdriver.json'),
    appium: require('../packages/webdriver/protocol/appium.json'),
    jsonwp: require('../packages/webdriver/protocol/jsonwp.json'),
    mjsonwp: require('../packages/webdriver/protocol/mjsonwp.json'),
    chromium: require('../packages/webdriver/protocol/chromium.json'),
    saucelabs: require('../packages/webdriver/protocol/saucelabs.json')
}
const PROTOCOL_NAMES = {
    appium: 'Appium',
    jsonwp: 'JSON Wire Protocol',
    mjsonwp: 'Mobile JSON Wire Protocol',
    webdriver: 'Webdriver Protocol',
    chromium: 'Chromium',
    saucelabs: 'Sauce Labs'
}
const MOBILE_PROTOCOLS = ['appium', 'mjsonwp']
const VENDOR_PROTOCOLS = ['chromium']

module.exports = { PROTOCOLS, PROTOCOL_NAMES, MOBILE_PROTOCOLS, VENDOR_PROTOCOLS }
