/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from '@wdio/logger'

import WebDriver, { DEFAULTS } from 'webdriver'
import { validateConfig } from '@wdio/config'
import { enableFileLogging, wrapCommand, isBidi } from '@wdio/utils'
import type { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'

import MultiRemote from './multiremote.js'
import SevereServiceErrorImport from './utils/SevereServiceError.js'
import detectBackend from './utils/detectBackend.js'
import { getProtocolDriver } from './utils/driver.js'
import { WDIO_DEFAULTS, Key as KeyConstant } from './constants.js'
import { getPrototype, addLocatorStrategyHandler, isStub } from './utils/index.js'
import { registerSessionManager } from './session/index.js'
import { environment } from './environment.js'

import type { AttachOptions } from './types.js'
import type * as elementCommands from './commands/element.js'
import { IMPLICIT_WAIT_EXCLUSION_LIST } from './middlewares.js'

export * from './types.js'
export const Key = KeyConstant
export const SevereServiceError = SevereServiceErrorImport

/**
 * A method to create a new session with WebdriverIO.
 *
 * <b>
 * NOTE: If you hit "error TS2694: Namespace 'global.WebdriverIO' has no exported member 'Browser'" when using typescript,
 * add "@wdio/globals/types" into tsconfig.json's "types" array will solve it: <code> { "compilerOptions": { "types": ["@wdio/globals/types"] } } </code>
 * </b>
 *
 * @param params Options to create the session with
 * @param remoteModifier Modifier function to change the monad object
 * @return browser object with sessionId
 * @see <a href="https://webdriver.io/docs/typescript">Typescript setup</a>
 */
export const remote = async function(
    params: Capabilities.WebdriverIOConfig,
    remoteModifier?: (client: WebDriverTypes.Client, options: Capabilities.WebdriverIOConfig) => WebDriverTypes.Client
): Promise<WebdriverIO.Browser> {
    const keysToKeep = Object.keys(environment.value.variables.WDIO_WORKER_ID ? params : DEFAULTS) as (keyof Capabilities.WebdriverIOConfig)[]
    const config = validateConfig<Capabilities.WebdriverIOConfig>(WDIO_DEFAULTS, params, keysToKeep)

    await enableFileLogging(config.outputDir)
    logger.setLogLevelsConfig(config.logLevels, config.logLevel)

    const modifier = (client: WebDriverTypes.Client, options: Capabilities.WebdriverIOConfig) => {
        /**
         * overwrite instance options with default values of the protocol
         * package (without undefined properties)
         */
        Object.assign(options, Object.entries(config)
            .reduce((a, [k, v]) => (typeof v === 'undefined' ? a : { ...a, [k]: v }), {}))

        if (typeof remoteModifier === 'function') {
            client = remoteModifier(client, options)
        }

        return client
    }

    const { Driver, options } = await getProtocolDriver({ ...params, ...config })
    const prototype = getPrototype('browser')
    const instance = await Driver.newSession(options, modifier, prototype, wrapCommand, IMPLICIT_WAIT_EXCLUSION_LIST) as WebdriverIO.Browser

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     */
    if ((params as Options.Testrunner).framework && !isStub(params.automationProtocol)) {
        instance.addCommand = instance.addCommand.bind(instance)
        instance.overwriteCommand = instance.overwriteCommand.bind(instance)
    }

    instance.addLocatorStrategy = addLocatorStrategyHandler(instance)
    await registerSessionManager(instance)
    return instance
}

export const attach = async function (attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
    /**
     * copy instances properties into new object
     */
    const params: Capabilities.WebdriverIOConfig & { requestedCapabilities: Capabilities.RequestedStandaloneCapabilities } = {
        automationProtocol: 'webdriver',
        ...detectBackend(attachOptions.options),
        ...attachOptions,
        capabilities: attachOptions.capabilities || {},
        requestedCapabilities: attachOptions.requestedCapabilities || {}
    }
    const prototype = getPrototype('browser')
    const { Driver } = await getProtocolDriver(params)

    const driver = Driver.attachToSession(
        params,
        undefined,
        prototype,
        wrapCommand
    ) as WebdriverIO.Browser
    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)

    /**
     * Wait for the Bidi handler to be connected before registering the session manager
     */
    if (isBidi(driver.capabilities) && '_bidiHandler' in driver) {
        await (driver['_bidiHandler'] as WebDriverTypes.BidiHandler).waitForConnected()
    }
    await registerSessionManager(driver)
    return driver
}

/**
 * WebdriverIO allows you to run multiple automated sessions in a single test.
 * This is handy when you're testing features that require multiple users (for example, chat or WebRTC applications).
 *
 * Instead of creating a couple of remote instances where you need to execute common commands like newSession() or url() on each instance,
 * you can simply create a multiremote instance and control all browsers at the same time.
 *
 * <b>
 * NOTE: Multiremote is not meant to execute all your tests in parallel.
 * It is intended to help coordinate multiple browsers and/or mobile devices for special integration tests (e.g. chat applications).
 * </b>
 *
 * @param params capabilities to choose desired devices.
 * @param automationProtocol
 * @return All remote instances, the first result represents the capability defined first in the capability object,
 * the second result the second capability and so on.
 *
 * @see <a href="https://webdriver.io/docs/multiremote">External document and example usage</a>.
 */
export const multiremote = async function (
    params: Capabilities.RequestedMultiremoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<WebdriverIO.MultiRemoteBrowser> {
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
    const sessionParams = isStub(automationProtocol) ? undefined : {
        sessionId: '',
        isW3C: multibrowser.instances[browserNames[0]].isW3C,
        logLevel: multibrowser.instances[browserNames[0]].options.logLevel
    }

    const ProtocolDriver = typeof automationProtocol === 'string'
        ? (await import(/* @vite-ignore */automationProtocol)).default
        : WebDriver
    const driver = ProtocolDriver.attachToSession(
        sessionParams,
        multibrowser.modifier.bind(multibrowser),
        prototype,
        wrapCommand
    ) as WebdriverIO.MultiRemoteBrowser

    /**
     * in order to get custom command overwritten or added to multiremote instance
     * we need to pass in the prototype of the multibrowser
     */
    if (!isStub(automationProtocol)) {
        const origAddCommand = driver.addCommand.bind(driver)
        // TODO dprevost need to add disableElementImplicitWait here ?
        driver.addCommand = (name: string, fn, attachToElement) => {
            driver.instances.forEach(instanceName =>
                driver.getInstance(instanceName).addCommand(name, fn, attachToElement)
            )

            return origAddCommand(
                name,
                fn,
                attachToElement,
                Object.getPrototypeOf(multibrowser.baseInstance),
                multibrowser.instances
            )
        }

        const origOverwriteCommand = driver.overwriteCommand.bind(driver) as typeof driver.overwriteCommand
        driver.overwriteCommand = (name, fn, attachToElement) => {
            return origOverwriteCommand<keyof typeof elementCommands, any, any>(
                name,
                fn,
                attachToElement,
                Object.getPrototypeOf(multibrowser.baseInstance),
                multibrowser.instances
            )
        }
    }

    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)
    return driver
}

