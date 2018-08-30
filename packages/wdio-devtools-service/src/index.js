import fs from 'fs'
import path from 'path'
import logger from 'wdio-logger'
import CDP from 'chrome-remote-interface'

const log = logger('wdio-devtools-service')

const UNSUPPORTED_ERROR_MESSAGE = 'The wdio-devtools-service currently only supports Chrome version 63 and up'
const RE_DEVTOOLS_DEBUGGING_PORT_SWITCH = /--remote-debugging-port=(\d*)/
const RE_USER_DATA_DIR_SWITCH = /--user-data-dir=([^-]*)/

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
            this.chromePort = await this._findChromePort()
        } catch (err) {
            log.error(`Couldn't connect to chrome: ${err.stack}`)
            return
        }

        this.client = await this._getCDPClient(this.chromePort)

        /**
         * allow to easily access the CDP from the browser object
         */
        global.browser.addCommand('cdp', (domain, command, args = {}) => {
            if (!this.client[domain]) {
                throw new Error(`Domain "${domain}" doesn't exist in the Chrome DevTools protocol`)
            }

            if (!this.client[domain][command]) {
                throw new Error(`The "${domain}" domain doesn't have a method called "${command}"`)
            }

            log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
            return new Promise((resolve, reject) => this.client[domain][command](args, (err, result) => {
                /* istanbul ignore if */
                if (err) {
                    return reject(new Error(`Chrome DevTools Error: ${result.message}`))
                }

                return resolve(result)
            }))
        })

        /**
         * helper method to receive Chrome remote debugging connection data to
         * e.g. use external tools like lighthouse
         */
        const { host, port } = this.client
        global.browser.addCommand('cdpConnection', () => ({ host, port }))

        /**
         * propagate CDP events to the browser event listener
         */
        this.client.on('event', (event) => {
            const method = event.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(event.params)}`)
            global.browser.emit(method, event.params)
        })
    }

    /**
     * Find Chrome DevTools Interface port by checking Chrome switches from the chrome://version
     * page. In case a newer version is used (+v65) we check the DevToolsActivePort file
     */
    async _findChromePort () {
        await global.browser.url('chrome://version')
        const cmdLineTextElem = await global.browser.$('#command_line')
        const cmdLineText = await cmdLineTextElem.getText()
        let port = parseInt(cmdLineText.match(RE_DEVTOOLS_DEBUGGING_PORT_SWITCH)[1], 10)

        /**
         * newer Chrome versions store port in DevToolsActivePort file
         */
        if (port === 0) {
            const userDataDir = cmdLineText.match(RE_USER_DATA_DIR_SWITCH)[1].trim()
            const devToolsActivePortFile = fs.readFileSync(path.join(userDataDir, 'DevToolsActivePort'), 'utf8')
            port = devToolsActivePortFile.split('\n').shift()
        }

        return port
    }

    async _getCDPClient (port) {
        return new Promise((resolve) => CDP({
            port,
            host: 'localhost',
            target: /* istanbul ignore next */ (targets) => targets.findIndex((t) => t.type === 'page')
        }, resolve))
    }
}
