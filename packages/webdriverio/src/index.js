import path from 'path'
import WebDriver from 'webdriver'
import { validateConfig, wrapCommand, runFnInFiberContext, detectBackend } from '@wdio/config'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import { getPrototype } from './utils'

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = async function (params = {}, remoteModifier) {
    const config = validateConfig(WDIO_DEFAULTS, params)
    const modifier = (client, options) => {
        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, Object.assign(options, config))
        }

        Object.assign(options, config)
        return client
    }

    if (params.user && params.key) {
        params = Object.assign({}, detectBackend(params), params)
    }

    if(params.outputDir){
        process.env.WDIO_LOG_PATH = path.join(params.outputDir, 'wdio.log')
    }

    const prototype = getPrototype('browser')
    const instance = await WebDriver.newSession(params, modifier, prototype, wrapCommand)

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     * in order to wrap the function within Fibers
     */
    const origAddCommand = ::instance.addCommand
    instance.addCommand = (name, fn, attachToElement) => (
        origAddCommand(name, runFnInFiberContext(fn), attachToElement)
    )

    const origOverwriteCommand = ::instance.overwriteCommand
    instance.overwriteCommand = (name, fn, attachToElement) => (
        origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement)
    )

    return instance
}

export const attach = function (params) {
    const prototype = getPrototype('browser')
    return WebDriver.attachToSession(params, null, prototype, wrapCommand)
}

export const multiremote = async function (params = {}) {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions
     */
    await Promise.all(
        browserNames.map((browserName) => {
            const config = validateConfig(WDIO_DEFAULTS, params[browserName])
            const modifier = (client, options) => {
                Object.assign(options, config)
                return client
            }
            const prototype = getPrototype('browser')
            const instance = WebDriver.newSession(params[browserName], modifier, prototype, wrapCommand)
            return multibrowser.addInstance(browserName, instance)
        })
    )

    /**
     * use attachToSession capability to wrap instances around blank pod
     */
    const prototype = getPrototype('browser')
    const sessionParams = {
        sessionId: '',
        isW3C: multibrowser.instances[browserNames[0]].isW3C,
        logLevel: multibrowser.instances[browserNames[0]].options.logLevel
    }
    const driver = WebDriver.attachToSession(sessionParams, ::multibrowser.modifier, prototype, wrapCommand)

    /**
     * in order to get custom command overwritten or added to multiremote instance
     * we need to pass in the prototype of the multibrowser
     */
    const origAddCommand = ::driver.addCommand
    driver.addCommand = (name, fn, attachToElement) => {
        origAddCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
    }

    const origOverwriteCommand = ::driver.overwriteCommand
    driver.overwriteCommand = (name, fn, attachToElement) => {
        origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
    }

    return driver
}
