import logger from '@wdio/logger'
import merge from 'lodash.merge'
import { validateConfig } from '@wdio/config'

import webdriverMonad from './monad'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'
import { getPrototype, environmentDetector } from './utils'

import WebDriverProtocol from '../protocol/webdriver.json'
import JsonWProtocol from '../protocol/jsonwp.json'
import MJsonWProtocol from '../protocol/mjsonwp.json'
import AppiumProtocol from '../protocol/appium.json'
import ChromiumProtocol from '../protocol/chromium.json'

export default class WebDriver {
    static async newSession (options = {}, modifier, userPrototype = {}, commandWrapper) {
        const params = validateConfig(DEFAULTS, options)
        logger.setLevel('webdriver', params.logLevel)

        /**
         * the user could have passed in either w3c style or jsonwp style caps
         * and we want to pass both styles to the server, which means we need
         * to check what style the user sent in so we know how to construct the
         * object for the other style
         */
        const [w3cCaps, jsonwpCaps] = params.capabilities && params.capabilities.alwaysMatch
            /**
             * in case W3C compliant capabilities are provided
             */
            ? [params.capabilities, params.capabilities.alwaysMatch]
            /**
             * otherwise assume they passed in jsonwp-style caps (flat object)
             */
            : [{ alwaysMatch: params.capabilities, firstMatch: [{}] }, params.capabilities]

        const sessionRequest = new WebDriverRequest(
            'POST',
            '/session',
            {
                capabilities: w3cCaps, // W3C compliant
                desiredCapabilities: jsonwpCaps // JSONWP compliant
            }
        )

        const response = await sessionRequest.makeRequest(params)

        /**
         * save original set of capabilities to allow to request the same session again
         * (e.g. for reloadSession command in WebdriverIO)
         */
        params.requestedCapabilities = { w3cCaps, jsonwpCaps }

        /**
         * save actual receveived session details
         */
        params.capabilities = response.value.capabilities || response.value

        /**
         * apply mobile flags to driver scope
         */
        const { isW3C, isMobile, isIOS, isAndroid, isChrome } = environmentDetector(params.capabilities)
        const environmentFlags = {
            isW3C: { value: isW3C },
            isMobile: { value: isMobile },
            isIOS: { value: isIOS },
            isAndroid: { value: isAndroid },
            isChrome: { value: isChrome }
        }

        const protocolCommands = getPrototype({ isW3C, isMobile, isIOS, isAndroid, isChrome })
        const prototype = merge(protocolCommands, environmentFlags, userPrototype)
        const monad = webdriverMonad(params, modifier, prototype)
        return monad(response.value.sessionId || response.sessionId, commandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static attachToSession (options = {}, modifier, userPrototype = {}, commandWrapper) {
        if (typeof options.sessionId !== 'string') {
            throw new Error('sessionId is required to attach to existing session')
        }

        logger.setLevel('webdriver', options.logLevel)

        options.capabilities = options.capabilities || {}
        options.isW3C = options.isW3C || true
        const prototype = Object.assign(getPrototype(options.isW3C), userPrototype)
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
    static get ChromiumProtocol () {
        return ChromiumProtocol
    }
}

/**
 * Helper methods consumed by webdriverio package
 */
export {
    webdriverMonad,
    getPrototype
}
