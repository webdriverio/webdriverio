import logger from 'wdio-logger'

import CommandHandler from './commands'
import { findChromePort, getCDPClient } from './utils'

const log = logger('wdio-devtools-service')
const UNSUPPORTED_ERROR_MESSAGE = 'The wdio-devtools-service currently only supports Chrome version 63 and up'

export default class DevToolsService {
    constructor () {
        this.isSupported = false
    }

    beforeSession (_, caps) {
        if (caps.browserName !== 'chrome' || (caps.version && caps.version < 63)) {
            return log.error(UNSUPPORTED_ERROR_MESSAGE)
        }

        this.isSupported = true
    }

    async before () {
        if (!this.isSupported) {
            return global.browser.addCommand('cdp', /* istanbul ignore next */ () => {
                throw new Error(UNSUPPORTED_ERROR_MESSAGE)
            })
        }

        try {
            const chromePort = await findChromePort()
            const client = await getCDPClient(chromePort)
            this.commandHandler = new CommandHandler(client, global.browser)
        } catch (err) {
            log.error(`Couldn't connect to chrome: ${err.stack}`)
            return
        }
    }
}
