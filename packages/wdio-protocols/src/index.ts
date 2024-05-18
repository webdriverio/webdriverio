import type AppiumCommands from './commands/appium.js'
import type ChromiumCommands from './commands/chromium.js'
import type GeckoCommands from './commands/gecko.js'
import type MJSONWPCommands from './commands/mjsonwp.js'
import type SauceLabsCommands from './commands/saucelabs.js'
import type SeleniumCommands from './commands/selenium.js'
import type WebDriverCommands from './commands/webdriver.js'

import WebDriverProtocol from './protocols/webdriver.js'
import WebDriverBidiProtocol from './protocols/webdriverBidi.js'
import MJsonWProtocol from './protocols/mjsonwp.js'
import AppiumProtocol from './protocols/appium.js'
import ChromiumProtocol from './protocols/chromium.js'
import GeckoProtocol from './protocols/gecko.js'
import SauceLabsProtocol from './protocols/saucelabs.js'
import SeleniumProtocol from './protocols/selenium.js'

export interface ProtocolCommands extends WebDriverCommands, AppiumCommands, ChromiumCommands, Omit<MJSONWPCommands, keyof AppiumCommands | keyof ChromiumCommands>, SauceLabsCommands, SeleniumCommands, GeckoCommands {}

export * from './types.js'
export {
    // protocols
    WebDriverProtocol, MJsonWProtocol, AppiumProtocol,
    ChromiumProtocol, SauceLabsProtocol, SeleniumProtocol, GeckoProtocol,
    WebDriverBidiProtocol,
    // commands
    AppiumCommands, ChromiumCommands, MJSONWPCommands,
    SauceLabsCommands, SeleniumCommands, WebDriverCommands, GeckoCommands
}

export const CAPABILITY_KEYS = [
    'browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts',
    'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'strictFileInteractability',
    'unhandledPromptBehavior', 'webSocketUrl'
]
