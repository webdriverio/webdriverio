import fs from 'fs'
import path from 'path'

import validateConfig from 'wdio-config'
import { WebDriverProtocol, MJsonWProtocol, AppiumProtocol, webdriverMonad, command } from 'webdriver'

import { WDIO_DEFAULTS } from './constants'

const ProtocolCommands = [...WebDriverProtocol, ...MJsonWProtocol, ...AppiumProtocol]

const remote = function (options = {}, modifier) {
    const params = validateConfig(WDIO_DEFAULTS, options)
    const monad = webdriverMonad(params, modifier)

    /**
     * register protcol commands
     */
    for (const [endpoint, methods] of Object.entries(ProtocolCommands)) {
        for (const [method, commandData] of Object.entries(methods)) {
            monad.lift(commandData.command, command(method, endpoint, commandData))
        }
    }

    /**
     * register action commands
     */
    const dir = path.resolve(__dirname, 'commands', 'browser')
    const files = fs.readdirSync(dir)
    for (let filename of files) {
        const commandName = filename.slice(0, -3)
        monad.lift(commandName, require(path.join(dir, commandName)))
    }

    const prototype = monad()
    return prototype
}

const multiremote = function () {
    /**
     * ToDo implement multiremote here
     */
}

export { remote, multiremote }
