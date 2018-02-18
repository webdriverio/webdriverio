import logger from 'wdio-logger'
import { validateConfig } from 'wdio-config'

import webdriverMonad from './monad'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'
import { getPrototype } from './utils'

import WebDriverProtocol from '../protocol/webdriver.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import AppiumProtocol from '../protocol/appium.json'

export default class WebDriver {
    static async newSession (options = {}, modifier, proto = {}, commandWrapper) {
        const params = validateConfig(DEFAULTS, options)
        logger.setLevel('webdriver', params.logLevel)

        const sessionRequest = new WebDriverRequest(
            'POST',
            '/session',
            {
                capabilities: params.capabilities, // W3C compliant
                desiredCapabilities: params.capabilities // JSONWP compliant
            }
        )

        const response = await sessionRequest.makeRequest(params)
        params.capabilities = response.value.capabilities || response.value

        const prototype = Object.assign(WebDriver.getPrototype(), proto)
        const monad = webdriverMonad(params, modifier, prototype)
        return monad(response.value.sessionId || response.sessionId, commandWrapper)
    }

    static get WebDriver () {
        return WebDriver
    }
    static get DEFAULTS () {
        return DEFAULTS
    }
    static get WebDriverProtocol () {
        return WebDriverProtocol
    }
    static get MJsonWProtocol () {
        return MJsonWProtocol
    }
    static get AppiumProtocol () {
        return AppiumProtocol
    }
    static get webdriverMonad () {
        return webdriverMonad
    }
    static get getPrototype () {
        return getPrototype
    }
}
