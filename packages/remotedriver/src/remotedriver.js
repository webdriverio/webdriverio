import fs from 'fs'
import path from 'path'
import CDP from 'chrome-remote-interface'

import { validate } from './utils'
import { CONNECTION_TIMEOUT } from './constants'

export default class RemoteDriver {
    constructor () {
        this.commands = {}

        const dir = path.resolve(__dirname, 'commands')
        const files = fs.readdirSync(dir)
        for (let filename of files) {
            const commandName = path.basename(filename, path.extname(filename))
            this.commands[commandName] = require(path.join(dir, commandName)).default
        }
    }

    register (commandInfo) {
        const self = this
        const { command, ref, parameters, variables = [] } = commandInfo

        /**
         * check if command is implemented
         */
        if (typeof this.commands[command] !== 'function') {
            return () => { throw new Error('Not yet implemented') }
        }

        /**
         * within here you find the webdriver scope
         */
        return async function (...args) {
            const connection = await self.ensureConnection(this)

            const params = validate(command, parameters, variables, ref, args)
            return self.commands[command](connection, params)
        }
    }

    ensureConnection (scope) {
        /**
         * return if already established
         * @param  {[type]} this [description]
         * @return {[type]}      [description]
         */
        if (this.connection) {
            return this.connection
        }

        const { debuggerAddress } = scope.capabilities['goog:chromeOptions']
        const [host, port] = debuggerAddress.split(':')
        return new Promise((resolve, reject) => {
            const connectionTimeout = setTimeout(
                () => reject(new Error(`Couldn't connect to ${debuggerAddress}`)),
                CONNECTION_TIMEOUT)

            CDP({ host, port, target: (targets) => targets.findIndex((t) => t.type === 'page') }, (connection) => {
                clearTimeout(connectionTimeout)
                this.connection = connection
                return resolve(connection)
            })
        })
    }
}
