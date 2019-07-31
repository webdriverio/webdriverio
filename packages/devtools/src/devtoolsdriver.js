import fs from 'fs'
import path from 'path'
import uuidv4 from 'uuid/v4'

import logger from '@wdio/logger'

import ElementStore from './elementstore'
import { validate, sanitizeError } from './utils'
import { DEFAULT_IMPLICIT_TIMEOUT, DEFAULT_PAGELOAD_TIMEOUT, DEFAULT_SCRIPT_TIMEOUT } from './constants'

const log = logger('devtools')

export default class DevToolsDriver {
    constructor (browser, pages) {
        this.commands = {}
        this.elementStore = new ElementStore()
        this.windows = new Map()
        this.timeouts = new Map()
        this.activeDialog = null
        this.browser = browser

        const dir = path.resolve(__dirname, 'commands')
        const files = fs.readdirSync(dir)
        for (let filename of files) {
            const commandName = path.basename(filename, path.extname(filename))
            this.commands[commandName] = DevToolsDriver.requireCommand(path.join(dir, commandName))
        }

        for (const page of pages) {
            const pageId = uuidv4()
            this.windows.set(pageId, page)
            this.currentWindowHandle = pageId
        }

        /**
         * set default timeouts
         */
        this.setTimeouts(DEFAULT_IMPLICIT_TIMEOUT, DEFAULT_PAGELOAD_TIMEOUT, DEFAULT_SCRIPT_TIMEOUT)

        const page = this.windows.get(this.currentWindowHandle)
        page.on('dialog', ::this.dialogHandler)
        page.on('framenavigated', ::this.framenavigatedHandler)
    }

    /**
     * moved into an extra method for testing purposes
     */
    /* istanbul ignore next */
    static requireCommand (filePath) {
        return require(filePath).default
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
            const params = validate(command, parameters, variables, ref, args)
            let result

            try {
                result = await self.commands[command].call(self, params)
            } catch (err) {
                throw sanitizeError(err)
            }

            log.info('RESULT', command.toLowerCase().includes('screenshot')
                && typeof result === 'string' && result.length > 64
                ? `${result.substr(0, 61)}...` : result)

            return result
        }
    }

    dialogHandler (dialog) {
        this.activeDialog = dialog
    }

    framenavigatedHandler (frame) {
        this.currentFrameUrl = frame.url()
        this.elementStore.clear()
    }

    setTimeouts (implicit, pageLoad, script) {
        if (typeof implicit === 'number') {
            this.timeouts.set('implicit', implicit)
        }
        if (typeof pageLoad === 'number') {
            this.timeouts.set('pageLoad', pageLoad)
        }
        if (typeof script === 'number') {
            this.timeouts.set('script', script)
        }

        const page = this.windows.get(this.currentWindowHandle)
        page.setDefaultTimeout(this.timeouts.get('pageLoad'))
    }
}
