import { Protocol } from './types'
import AppiumCommands from './commands/appium'
import ChromiumCommands from './commands/chromium'
import JSONWPCommands from './commands/jsonwp'
import MJSONWPCommands from './commands/mjsonwp'
import SauceLabsCommands from './commands/saucelabs'
import SeleniumCommands from './commands/selenium'
import WebDriverCommands from './commands/webdriver'

const WebDriverProtocol: Protocol = require('../protocols/webdriver.json')
const MJsonWProtocol: Protocol = require('../protocols/mjsonwp.json')
const JsonWProtocol: Protocol = require('../protocols/jsonwp.json')
const AppiumProtocol: Protocol = require('../protocols/appium.json')
const ChromiumProtocol: Protocol = require('../protocols/chromium.json')
const SauceLabsProtocol: Protocol = require('../protocols/saucelabs.json')
const SeleniumProtocol: Protocol = require('../protocols/selenium.json')

export * from './types'
export {
    // protocols
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol,
    // commands
    AppiumCommands, ChromiumCommands, JSONWPCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands
}
