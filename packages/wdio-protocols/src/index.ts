import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { Protocol } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import AppiumCommands from './commands/appium'
const AppiumProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/appium.json')).toString())

import ChromiumCommands from './commands/chromium'
const ChromiumProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/chromium.json')).toString())

import JSONWPCommands from './commands/jsonwp'
const JsonWProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/jsonwp.json')).toString())

import MJSONWPCommands from './commands/mjsonwp'
const MJsonWProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/mjsonwp.json')).toString())

import SauceLabsCommands from './commands/saucelabs'
const SauceLabsProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/saucelabs.json')).toString())

import SeleniumCommands from './commands/selenium'
const SeleniumProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/selenium.json')).toString())

import WebDriverCommands from './commands/webdriver'
const WebDriverProtocol: Protocol = JSON.parse((await fs.promises.readFile(__dirname + '/protocols/webdriver.json')).toString())

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

export * from './types.js'
export {
    // protocols
    WebDriverProtocol, MJsonWProtocol, JsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol,
    // sync commands
    AppiumCommands, ChromiumCommands, JSONWPCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands,
    // async commands
    WebDriverCommandsAsync, AppiumCommandsAsync, ChromiumCommandsAsync,
    JSONWPCommandsAsync, MJSONWPCommandsAsync, SauceLabsCommandsAsync,
    SeleniumCommandsAsync
}
