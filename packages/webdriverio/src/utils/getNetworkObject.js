import puppeteer from 'puppeteer-core'
import clone from 'lodash.clonedeep'
import logger from '@wdio/logger'
import { webdriverMonad, wrapCommand, commandCallStructure } from '@wdio/utils'

const log = logger('webdriverio')

import { FF_REMOTE_DEBUG_ARG } from '../constants'
import { getBrowserObject, getPrototype as getWDIOPrototype } from '../utils'

/**
 * transforms and findElement response into a WDIO element
 * @param  {String} selector  selector that was used to query the element
 * @param  {Object} res       findElement response
 * @return {Object}           WDIO element object
 */
export const getNetwork = function getNetwork () {
    const browser = getBrowserObject(this)
    const propertiesObject = {
        ...clone(browser.__propertiesObject__),
        ...Object.entries(getWDIOPrototype('network')).reduce(
            (scope, [name, cmd]) => {
                scope[name] = { value: command(name, cmd) }
                return scope
            }, {}),
        scope: 'network'
    }

    const network = webdriverMonad(this.options, (client) => {
        client.puppeteer = null
        client.capabilities = this.capabilities
        client.parent = this
        return client
    }, propertiesObject)

    return network(this.sessionId, wrapCommand)
}

/**
 * Command wrapper for pure WebdriverIO commands
 * @param {String}   commandName name of the command to be called
 * @param {Function} command     actual command to execute
 */
export const command = (commandName, command) => {
    return async function (...args) {
        this.emit('command', { method: commandName, body: args })
        log.info('COMMAND', commandCallStructure(commandName, args))

        /**
         * attach Puppeteer to the session if running locally
         */
        if (!this.isSauce) {
            await getPuppeteer.call(this)
        }

        const result = await command.value.apply(this, args)

        if (result != null) {
            log.info('RESULT', result)
        }

        return result
    }
}

/**
 * attach puppeteer to the driver scope so it can be used in the
 * command
 */
export const getPuppeteer = async function getPuppeteer () {
    /**
     * check if we already connected Puppeteer and if so return
     * that instance
     */
    if (this.puppeteer) {
        return this.puppeteer
    }

    /**
     * attach to Chromes debugger session
     */
    const chromeOptions = this.capabilities['goog:chromeOptions']
    if (chromeOptions && chromeOptions.debuggerAddress) {
        this.puppeteer = await puppeteer.connect({
            browserURL: `http://${this.capabilities['goog:chromeOptions'].debuggerAddress}`,
            defaultViewport: null
        })
        return this.puppeteer
    }

    /**
     * attach to Firefox debugger session
     */
    if (this.capabilities.browserName.toLowerCase() === 'firefox') {
        const majorVersion = parseInt(this.capabilities.browserVersion.split('.').shift(), 10)
        if (majorVersion >= 79) {
            const ffArgs = this.requestedCapabilities['moz:firefoxOptions'].args
            const rdPort = ffArgs[ffArgs.findIndex((arg) => arg === FF_REMOTE_DEBUG_ARG) + 1]
            this.puppeteer = await puppeteer.connect({
                browserURL: `http://localhost:${rdPort}`,
                defaultViewport: null
            })
            return this.puppeteer
        }
    }

    throw new Error(
        'Network primitives aren\'t available for this session. ' +
        'This feature is only support for local Chrome, Firefox and Edge testing.'
    )
}
