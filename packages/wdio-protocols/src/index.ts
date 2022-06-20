import { Protocol } from './types'
import AppiumCommands from './commands/appium'
import ChromiumCommands from './commands/chromium'
import GeckoCommands from './commands/gecko'
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
const GeckoProtocol: Protocol = require('../protocols/gecko.json')
const SauceLabsProtocol: Protocol = require('../protocols/saucelabs.json')
const SeleniumProtocol: Protocol = require('../protocols/selenium.json')

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
type GeckoCommandsAsync = {
    [K in keyof GeckoCommands]:
    (...args: Parameters<GeckoCommands[K]>) => Promise<ReturnType<GeckoCommands[K]>>
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
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    // sync commands
    AppiumCommands, ChromiumCommands, JSONWPCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands, GeckoCommands,
    // async commands
    WebDriverCommandsAsync, AppiumCommandsAsync, ChromiumCommandsAsync,
    JSONWPCommandsAsync, MJSONWPCommandsAsync, SauceLabsCommandsAsync,
    SeleniumCommandsAsync, GeckoCommandsAsync
}

export const CAPABILITY_KEYS = [
    'browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts',
    'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'strictFileInteractability',
    'unhandledPromptBehavior'
]
