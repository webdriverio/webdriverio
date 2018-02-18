import WebDriver from 'webdriver'
import { validateConfig, wrapCommand } from 'wdio-config'

import { WDIO_DEFAULTS } from './constants'
import { getPrototype } from './utils'

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
const remote = function (params = {}, remoteModifier) {
    const config = validateConfig(WDIO_DEFAULTS, params)
    const modifier = (client, options) => {
        options = Object.assign(options, config)

        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, options)
        }

        return client
    }

    const prototype = getPrototype('browser')
    return WebDriver.newSession(params, modifier, prototype, wrapCommand)
}

const multiremote = function () {
    /**
     * ToDo implement multiremote here
     */
    return 'NYI'
}

export { remote, multiremote }
