import logger from 'wdio-logger'
import { validateConfig } from 'wdio-config'

import webdriverMonad from './monad'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'
import { getPrototype } from './utils'

import WebDriverProtocol from '../protocol/webdriver.json'
import JsonWProtocol from '../protocol/jsonwp.json'
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
        params.requestedCapabilities = params.capabilities
        params.capabilities = response.value.capabilities || response.value
        params.isW3C = Boolean(response.value.capabilities)

        const prototype = Object.assign(WebDriver.getPrototype(params.isW3C), proto)
        const monad = webdriverMonad(params, modifier, prototype)
        return monad(response.value.sessionId || response.sessionId, commandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static attachToSession (options = {}, modifier, proto = {}, commandWrapper) {
        if (typeof options.sessionId !== 'string') {
            throw new Error('sessionId is required to attach to existing session')
        }

        options.capabilities = options.capabilities || {}
        options.isW3C = options.isW3C || true
        const prototype = Object.assign(WebDriver.getPrototype(options.isW3C), proto)
        const monad = webdriverMonad(options, modifier, prototype)
        return monad(options.sessionId, commandWrapper)
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
    static get JsonWProtocol () {
        return JsonWProtocol
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
