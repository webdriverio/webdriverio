import WebDriver from 'webdriver'
import { validateConfig, wrapCommand } from 'wdio-config'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import { getPrototype } from './utils'

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

        return client
    }

    const prototype = getPrototype('browser')
    return WebDriver.newSession(params, modifier, prototype, wrapCommand)
}

export const multiremote = async function (params = {}) {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions
     */
    await Promise.all(
        browserNames.map((browserName) => multibrowser.addInstance(browserName, remote(params[browserName])))
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
