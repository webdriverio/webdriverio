import { dirname } from '@wdio/shim'
import { readFileSync } from 'fs'

import { Protocol } from './types'
import type AppiumCommands from './commands/appium'
import type ChromiumCommands from './commands/chromium'
import type GeckoCommands from './commands/gecko'
import type JSONWPCommands from './commands/jsonwp'
import type MJSONWPCommands from './commands/mjsonwp'
import type SauceLabsCommands from './commands/saucelabs'
import type SeleniumCommands from './commands/selenium'
import type WebDriverCommands from './commands/webdriver'

const WebDriverProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/webdriver.json')).toString())
const MJsonWProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/mjsonwp.json')).toString())
const JsonWProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/jsonwp.json')).toString())
const AppiumProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/appium.json')).toString())
const ChromiumProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/chromium.json')).toString())
const GeckoProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/gecko.json')).toString())
const SauceLabsProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/saucelabs.json')).toString())
const SeleniumProtocol: Protocol = JSON.parse((readFileSync(dirname + '/../protocols/selenium.json')).toString())

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

export * from './types.js'
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
