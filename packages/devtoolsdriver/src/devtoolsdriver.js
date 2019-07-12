import fs from 'fs'
import path from 'path'

import logger from '@wdio/logger'

import ElementStore from './elementstore'
import { validate } from './utils'

const log = logger('remotedriver')

export default class RemoteDriver {
    constructor () {
        this.commands = {}
        this.elementStore = new ElementStore()

        const dir = path.resolve(__dirname, 'commands')
        const files = fs.readdirSync(dir)
        for (let filename of files) {
            const commandName = path.basename(filename, path.extname(filename))
            this.commands[commandName] = require(path.join(dir, commandName)).default
        }
    }

    register (commandInfo, sessionMap) {
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
            const browser = sessionMap.get(this.sessionId)

            /**
             * check if session exist
             */
            if (!browser) {
                throw new Error(`Session with sessionId ${this.sessionId} not found`)
            }

            const params = validate(command, parameters, variables, ref, args)
            const result = await self.commands[command].call(self, browser, params)

            log.info('RESULT', command.toLowerCase().includes('screenshot')
                && typeof result === 'string' && result.length > 64
                ? `${result.substr(0, 61)}...` : result)

            if (command === 'newSession') {
                this.browser = result
            }

            return result
        }
    }
}
