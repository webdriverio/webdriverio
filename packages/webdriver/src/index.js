import validateConfig from 'wdio-config'
import logger from 'wdio-logger'

import webdriverMonad from './monad'
import command from './command'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'

import WebDriverProtocol from '../protocol/webdriver.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import AppiumProtocol from '../protocol/appium.json'

const ProtocolCommands = Object.assign(WebDriverProtocol, MJsonWProtocol, AppiumProtocol)

export default class WebDriver {
    static async newSession (options = {}, modifier) {
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
        const monad = webdriverMonad(params, modifier)

        for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
            for (const [method, commandData] of Object.entries(methods)) {
                monad.lift(commandData.command, command(method, endpoint, commandData))
            }
        }

        const prototype = monad(response.value.sessionId || response.sessionId)
        return prototype
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
    static get command () {
        return command
    }
}
