import logger from '@wdio/logger'

import CommandHandler from './commands'
import { findCDPInterface, getCDPClient } from './utils'

const log = logger('@wdio/devtools-service')
const UNSUPPORTED_ERROR_MESSAGE = 'The @wdio/devtools-service currently only supports Chrome version 63 and up'

export default class DevToolsService {
    constructor (options = {}) {
        this.options = options
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
            let debuggerAddress
            if (this.options.debuggerAddress) {
                const [host, port] = this.options.debuggerAddress.split(':')
                debuggerAddress = { host, port: parseInt(port, 10) }
            } else {
                debuggerAddress = await findCDPInterface()
            }
            const client = await getCDPClient(debuggerAddress)
            this.commandHandler = new CommandHandler(client, global.browser)
        } catch (err) {
            log.error(`Couldn't connect to chrome: ${err.stack}`)
            return
        }

        /**
         * enable network and page domain for resource analysis
         */
        await this.commandHandler.cdp('Network', 'enable')
        await this.commandHandler.cdp('Page', 'enable')
    }
}
