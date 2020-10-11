import path from 'path'
import logger from '@wdio/logger'
import WebDriver, { DEFAULTS } from 'webdriver'
import { validateConfig, detectBackend } from '@wdio/config'
import { wrapCommand, runFnInFiberContext } from '@wdio/utils'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import {
    getPrototype, addLocatorStrategyHandler, isStub, getAutomationProtocol,
    updateCapabilities
} from './utils'
import SevereServiceError from './utils/SevereServiceError'

const log = logger('webdriverio')

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = async function (params = {}, remoteModifier) {
    logger.setLogLevelsConfig(params.logLevels, params.logLevel)

    const config = validateConfig(WDIO_DEFAULTS, params, Object.keys(DEFAULTS))
    const automationProtocol = await getAutomationProtocol(config)
    const modifier = (client, options) => {
        /**
         * overwrite instance options with default values of the protocol
         * package (without undefined properties)
         */
        Object.assign(options, Object.entries(config)
            .reduce((a, [k, v]) => (v == null ? a : { ...a, [k]: v }), {}))

        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, options)
        }

        options.automationProtocol = automationProtocol
        return client
    }

    if (params.user && params.key) {
        params = Object.assign({}, detectBackend(params), params)
    }

    if (params.outputDir) {
        process.env.WDIO_LOG_PATH = path.join(params.outputDir, 'wdio.log')
    }

    const prototype = getPrototype('browser')
    log.info(`Initiate new session using the ${automationProtocol} protocol`)
    const ProtocolDriver = require(automationProtocol).default

    await updateCapabilities(params, automationProtocol)
    const instance = await ProtocolDriver.newSession(params, modifier, prototype, wrapCommand)

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     * in order to wrap the function within Fibers (only if webdriverio
     * is used with @wdio/cli)
     */
    if (params.runner && !isStub(automationProtocol)) {
        const origAddCommand = instance.addCommand.bind(instance)
        instance.addCommand = (name, fn, attachToElement) => (
            origAddCommand(name, runFnInFiberContext(fn), attachToElement)
        )

        const origOverwriteCommand = instance.overwriteCommand.bind(instance)
        instance.overwriteCommand = (name, fn, attachToElement) => (
            origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement)
        )
    }

    instance.addLocatorStrategy = addLocatorStrategyHandler(instance)
    return instance
}

export const attach = function (params) {
    const prototype = getPrototype('browser')
    return WebDriver.attachToSession(params, null, prototype, wrapCommand)
}

export const multiremote = async function (params = {}, config = {}) {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions
     */
    await Promise.all(
        browserNames.map(async (browserName) => {
            const instance = await remote(params[browserName])
            return multibrowser.addInstance(browserName, instance)
        })
    )

    /**
     * use attachToSession capability to wrap instances around blank pod
     */
    const prototype = getPrototype('browser')
    const sessionParams = isStub(config.automationProtocol) ? undefined : {
        sessionId: '',
        isW3C: multibrowser.instances[browserNames[0]].isW3C,
        logLevel: multibrowser.instances[browserNames[0]].options.logLevel
    }

    const ProtocolDriver = isStub(config.automationProtocol) ? require(config.automationProtocol).default : WebDriver
    const driver = ProtocolDriver.attachToSession(sessionParams, multibrowser.modifier.bind(multibrowser), prototype, wrapCommand)

    /**
     * in order to get custom command overwritten or added to multiremote instance
     * we need to pass in the prototype of the multibrowser
     */
    if (!isStub(config.automationProtocol)) {
        const origAddCommand = driver.addCommand.bind(driver)
        driver.addCommand = (name, fn, attachToElement) => {
            origAddCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
        }

        const origOverwriteCommand = driver.overwriteCommand.bind(driver)
        driver.overwriteCommand = (name, fn, attachToElement) => {
            origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
        }
    }

    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)

    return driver
}

export { SevereServiceError }
