import AppiumCommands from './commands/appium'
import AppiumProtocol from './protocols/appium.json'

import ChromiumCommands from './commands/chromium'
import ChromiumProtocol from './protocols/chromium.json'

import JSONWPCommands from './commands/jsonwp'
import JSONWProtocol from './protocols/jsonwp.json'

import MJSONWPCommands from './commands/mjsonwp'
import MJSONWProtocol from './protocols/mjsonwp.json'

import SauceLabsCommands from './commands/saucelabs'
import SauceLabsProtocol from './protocols/saucelabs.json'

import SeleniumCommands from './commands/selenium'
import SeleniumProtocol from './protocols/selenium.json'

import WebDriverCommands from './commands/webdriver'
import WebDriverProtocol from './protocols/webdriver.json'

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

export interface ProtocolCommands extends WebDriverCommands, Omit<JSONWPCommands, keyof WebDriverCommands>, AppiumCommands, ChromiumCommands, Omit<MJSONWPCommands, keyof AppiumCommands | keyof ChromiumCommands>, SauceLabsCommands, SeleniumCommands {}
export interface ProtocolCommandsAsync extends WebDriverCommandsAsync, Omit<JSONWPCommandsAsync, keyof WebDriverCommandsAsync>, AppiumCommandsAsync, ChromiumCommandsAsync, Omit<MJSONWPCommandsAsync, keyof AppiumCommandsAsync | keyof ChromiumCommandsAsync>, SauceLabsCommandsAsync, SeleniumCommandsAsync {}

export * from './types'
export {
    // protocols
    WebDriverProtocol, MJSONWProtocol, JSONWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol,
    // sync commands
    AppiumCommands, ChromiumCommands, JSONWPCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands,
    // async commands
    WebDriverCommandsAsync, AppiumCommandsAsync, ChromiumCommandsAsync,
    JSONWPCommandsAsync, MJSONWPCommandsAsync, SauceLabsCommandsAsync,
    SeleniumCommandsAsync
}
