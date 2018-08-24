import WebDriver from 'webdriver'
import { validateConfig, wrapCommand, detectBackend } from 'wdio-config'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import { getPrototype, mobileDetector } from './utils'

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = function (params = {}, remoteModifier) {
    const config = validateConfig(WDIO_DEFAULTS, params)
    const modifier = (client, options) => {
        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, Object.assign(options, config))
        }

        Object.assign(options, config)
        return client
    }

    if (params.user && params.key) {
        params = Object.assign(params, detectBackend(params))
    }

    const prototype = getPrototype('browser')

    /**
     * apply mobile check flags to browser scope
     */
    const mobileDetection = mobileDetector(params.capabilities)
    Object.assign(prototype, Object.keys(mobileDetection).reduce((proto, flag) => {
        proto[flag] = { value: mobileDetection[flag] }
        return proto
    }, {}))

    return WebDriver.newSession(params, modifier, prototype, wrapCommand)
}

export const multiremote = async function (params = {}) {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions
     */
    await Promise.all(
        browserNames.map((browserName) => {
            validateConfig(WDIO_DEFAULTS, params[browserName])
            const prototype = getPrototype('browser')
            const instance = WebDriver.newSession(params[browserName], null, prototype)
            return multibrowser.addInstance(browserName, instance)
        })
    )

    /**
     * use attachToSession capability to wrap instances around blank pod
     */
    const prototype = getPrototype('browser')
    const sessionParams = {
        sessionId: '',
        isW3C: multibrowser.instances[browserNames[0]].isW3C
    }
    return WebDriver.attachToSession(sessionParams, ::multibrowser.modifier, prototype)
}
