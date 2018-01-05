import fs from 'fs'
import path from 'path'

import WebDriver from 'webdriver'
import { validateConfig } from 'wdio-config'

import { WDIO_DEFAULTS } from './constants'

const remote = async function (params = {}, modifier) {
    const client = await WebDriver.newSession(params, (client, options) => {
        options = Object.assign(options, validateConfig(WDIO_DEFAULTS, params))

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        return client
    })

    /**
     * register action commands
     */
    const dir = path.resolve(__dirname, 'commands', 'browser')
    const files = fs.readdirSync(dir)
    for (let filename of files) {
        const commandName = filename.slice(0, -3)
        client.addCommand(commandName, require(path.join(dir, commandName)))
    }

    return client
}

const multiremote = function () {
    /**
     * ToDo implement multiremote here
     */
    return 'NYI'
}

export { remote, multiremote }
