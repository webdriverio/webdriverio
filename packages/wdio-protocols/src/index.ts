import { Protocol } from './types'
import AppiumCommands from './commands/appium'
import ChromiumCommands from './commands/chromium'
import JSONWPCommands from './commands/jsonwp'
import MJSONWPCommands from './commands/mjsonwp'
import SauceLabsCommands from './commands/saucelabs'
import SeleniumCommands from './commands/selenium'
import WebDriverCommands from './commands/webdriver'

type WebDriverCommandsAsync = {
    [K in keyof WebDriverCommands]:
    (...args: Parameters<WebDriverCommands[K]>) => Promise<ReturnType<WebDriverCommands[K]>>
}
type AppiumCommandsAsync = {
    [K in keyof AppiumCommands]:
    (...args: Parameters<AppiumCommands[K]>) => Promise<ReturnType<AppiumCommands[K]>>
}
type ChromiumCommandsAsync = {
    [K in keyof ChromiumCommands]:
    (...args: Parameters<ChromiumCommands[K]>) => Promise<ReturnType<ChromiumCommands[K]>>
}
type JSONWPCommandsAsync = {
    [K in keyof JSONWPCommands]:
    (...args: Parameters<JSONWPCommands[K]>) => Promise<ReturnType<JSONWPCommands[K]>>
}
type MJSONWPCommandsAsync = {
    [K in keyof MJSONWPCommands]:
    (...args: Parameters<MJSONWPCommands[K]>) => Promise<ReturnType<MJSONWPCommands[K]>>
}
type SauceLabsCommandsAsync = {
    [K in keyof SauceLabsCommands]:
    (...args: Parameters<SauceLabsCommands[K]>) => Promise<ReturnType<SauceLabsCommands[K]>>
}
type SeleniumCommandsAsync = {
    [K in keyof SeleniumCommands]:
    (...args: Parameters<SeleniumCommands[K]>) => Promise<ReturnType<SeleniumCommands[K]>>
}

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
    // commands sync
    AppiumCommands, ChromiumCommands, JSONWPCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands,
    // commands async
    AppiumCommandsAsync, ChromiumCommandsAsync, JSONWPCommandsAsync,
    MJSONWPCommandsAsync, SauceLabsCommandsAsync, SeleniumCommandsAsync,
    WebDriverCommandsAsync
}
