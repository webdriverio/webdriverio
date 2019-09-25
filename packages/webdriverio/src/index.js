import path from 'path'
import WebDriver from 'webdriver'
import logger from '@wdio/logger'
import { validateConfig, detectBackend } from '@wdio/config'
import { wrapCommand, runFnInFiberContext } from '@wdio/utils'

import MultiRemote from './multiremote'
import { WDIO_DEFAULTS } from './constants'
import { getPrototype, addLocatorStrategyHandler } from './utils'

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
    log.info(`Initiate new session using the ${config.automationProtocol} protocol`)
    const ProtocolDriver = require(config.automationProtocol).default
    const commandWrapper = params.runner ? wrapCommand : (_, origFn) => origFn
    const instance = await ProtocolDriver.newSession(params, modifier, prototype, commandWrapper)

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     * in order to wrap the function within Fibers (only if webdriverio
     * is used with @wdio/cli)
     */
    if (params.runner && !isStub(config.automationProtocol)) {
        const origAddCommand = ::instance.addCommand
        instance.addCommand = (name, fn, attachToElement) => (
            origAddCommand(name, runFnInFiberContext(fn), attachToElement)
        )

        const origOverwriteCommand = ::instance.overwriteCommand
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
    const driver = ProtocolDriver.attachToSession(sessionParams, ::multibrowser.modifier, prototype, wrapCommand)

    /**
     * in order to get custom command overwritten or added to multiremote instance
     * we need to pass in the prototype of the multibrowser
     */
    if (!isStub(config.automationProtocol)) {
        const origAddCommand = ::driver.addCommand
        driver.addCommand = (name, fn, attachToElement) => {
            origAddCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
        }

        const origOverwriteCommand = ::driver.overwriteCommand
        driver.overwriteCommand = (name, fn, attachToElement) => {
            origOverwriteCommand(name, runFnInFiberContext(fn), attachToElement, Object.getPrototypeOf(multibrowser.baseInstance), multibrowser.instances)
        }
    }

    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)

    return driver
}

const isStub = (automationProtocol) => automationProtocol === './protocol-stub'
