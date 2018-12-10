import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'

import webdriverMonad from './monad'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'
import { getPrototype, isW3CSession } from './utils'

import WebDriverProtocol from '../protocol/webdriver.json'
import JsonWProtocol from '../protocol/jsonwp.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import AppiumProtocol from '../protocol/appium.json'

export default class WebDriver {
    static async newSession (options = {}, modifier, proto = {}, commandWrapper) {
        const params = validateConfig(DEFAULTS, options)
        logger.setLevel('webdriver', params.logLevel)

        let w3cCaps, jsonwpCaps;

        // the user could have passed in either w3c style or jsonwp style caps
        // and we want to pass both styles to the server, which means we need
        // to check what style the user sent in so we know how to construct the
        // object for the other style
        if (params.capabilities && params.capabilities.alwaysMatch) {
            // user passed in w3c-style caps (multi-layer object)
            w3cCaps = params.capabilities;
            jsonwpCaps = params.capabilities.alwaysMatch;
        } else {
            // otherwise assume they passed in jsonwp-style caps (flat object)
            w3cCaps = {alwaysMatch: params.capabilities, firstMatch: [{}]};
            jsonwpCaps = params.capabilities;
        }


        const sessionRequest = new WebDriverRequest(
            'POST',
            '/session',
            {
                capabilities: w3cCaps, // W3C compliant
                desiredCapabilities: jsonwpCaps // JSONWP compliant
            }
        )

        const response = await sessionRequest.makeRequest(params)
        params.requestedCapabilities = params.capabilities
        params.capabilities = response.value.capabilities || response.value
        params.isW3C = isW3CSession(response.value)

        const prototype = Object.assign(getPrototype(params.isW3C), proto)
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
        const prototype = Object.assign(getPrototype(options.isW3C), proto)
        const monad = webdriverMonad(options, modifier, prototype)
        return monad(options.sessionId, commandWrapper)
    }

    static get WebDriver () {
        return WebDriver
    }
    static get DEFAULTS () {
        return DEFAULTS
    }
    /**
     * Protocols
     */
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
}

/**
 * Helper methods consumed by webdriverio package
 */
export {
    webdriverMonad,
    getPrototype
}
