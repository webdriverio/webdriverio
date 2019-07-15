import os from 'os'
import merge from 'lodash.merge'
import uuidv4 from 'uuid/v4'
import logger from '@wdio/logger'
import { webdriverMonad } from '@wdio/utils'
import { validateConfig } from '@wdio/config'

import DevToolsDriver from './devtoolsdriver'
import launch from './launcher'
import { DEFAULTS } from './constants'
import { getPrototype } from './utils'

const driver = new DevToolsDriver()
const sessionMap = new Map()

function commandWrapper (_, __, commandInfo) {
    return driver.register(commandInfo, sessionMap)
}

export default class DevTools {
    static async newSession (options = {}, modifier, userPrototype = {}, customCommandWrapper) {
        const params = validateConfig(DEFAULTS, options)
        const environment = {
            isDevTools: { value: true }
        }

        if (!options.logLevels || !options.logLevels['devtools']) {
            logger.setLevel('devtools', params.logLevel)
        }

        const browser = await launch(params.capabilities)
        const sessionId = uuidv4()
        const [browserName, browserVersion] = (await browser.version()).split('/')

        params.capabilities = {
            browserName,
            browserVersion,
            platformName: os.platform(),
            platformVersion: os.release()
        }

        /**
         * save original set of capabilities to allow to request the same session again
         * (e.g. for reloadSession command in WebdriverIO)
         */
        params.requestedCapabilities = {
            w3cCaps: params.capabilities,
            jsonwpCaps: params.capabilities
        }

        sessionMap.set(sessionId, browser)
        const protocolCommands = getPrototype(commandWrapper)
        const prototype = merge(protocolCommands, environment, userPrototype)

        const monad = webdriverMonad(params, modifier, prototype)
        return monad(sessionId, customCommandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static attachToSession () {
        throw new Error('not yet implemented')
    }
}
