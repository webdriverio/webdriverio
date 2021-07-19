import logger from '@wdio/logger'

import WebDriver from 'webdriver'
import { DEFAULTS } from 'webdriver'
import { validateConfig } from '@wdio/config'
import { wrapCommand, runFnInFiberContext } from '@wdio/utils'
import { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'

import MultiRemote from './multiremote'
import type ElementCommands from './commands/element'
import SevereServiceErrorImport from './utils/SevereServiceError'
import detectBackend from './utils/detectBackend'
import { WDIO_DEFAULTS } from './constants'
import {
    getPrototype, addLocatorStrategyHandler, isStub, getAutomationProtocol,
    updateCapabilities
} from './utils'
import type { Browser, MultiRemoteBrowser, AttachOptions } from './types'

export type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities'>

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = async function (params: RemoteOptions, remoteModifier?: Function): Promise<Browser<'async'>> {
    logger.setLogLevelsConfig(params.logLevels as any, params.logLevel)

    const config = validateConfig<RemoteOptions>(WDIO_DEFAULTS, params, Object.keys(DEFAULTS) as any)
    const automationProtocol = await getAutomationProtocol(config)
    const modifier = (client: WebDriverTypes.Client, options: Options.WebdriverIO) => {
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

    const prototype = getPrototype('browser')
    const ProtocolDriver = (await import(automationProtocol)).default

    params = Object.assign({}, detectBackend(params), params)
    await updateCapabilities(params, automationProtocol)
    const instance: WebdriverIO.Browser = await ProtocolDriver.newSession(params, modifier, prototype, wrapCommand)

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     * in order to wrap the function within Fibers (only if webdriverio
     * is used with @wdio/cli)
     */
    if ((params as Options.Testrunner).framework && !isStub(automationProtocol)) {
        const origAddCommand = instance.addCommand.bind(instance)
        instance.addCommand = (name: string, fn: Function, attachToElement) => (
            origAddCommand(name, runFnInFiberContext(fn), attachToElement)
        )

        const origOverwriteCommand = instance.overwriteCommand.bind(instance)
        instance.overwriteCommand = (name: string, fn: Function, attachToElement) => (
            origOverwriteCommand<keyof typeof ElementCommands, any, any>(name, runFnInFiberContext(fn), attachToElement)
        )
    }

    instance.addLocatorStrategy = addLocatorStrategyHandler(instance)
    return instance
}

export const attach = async function (attachOptions: AttachOptions): Promise<Browser<'async'>> {
    /**
     * copy instances properties into new object
     */
    const params = {
        ...attachOptions,
        options: { ...attachOptions.options },
        ...detectBackend(attachOptions),
        requestedCapabilities: attachOptions.requestedCapabilities
    }

    const prototype = getPrototype('browser')

    let automationProtocol = 'webdriver'
    if (params.options?.automationProtocol) {
        automationProtocol = params.options?.automationProtocol
    }
    const ProtocolDriver = (await import(automationProtocol)).default
    return ProtocolDriver.attachToSession(params, undefined, prototype, wrapCommand) as WebdriverIO.Browser
}

export const multiremote = async function (
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<MultiRemoteBrowser<'async'>> {
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

    const ProtocolDriver = automationProtocol && isStub(automationProtocol)
        ? require(automationProtocol).default
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
        driver.addCommand = (name: string, fn: Function, attachToElement) => {
            return origAddCommand(
                name,
                runFnInFiberContext(fn),
                attachToElement,
                Object.getPrototypeOf(multibrowser.baseInstance),
                multibrowser.instances
            )
        }

        const origOverwriteCommand = driver.overwriteCommand.bind(driver)
        driver.overwriteCommand = (name: string, fn: Function, attachToElement) => {
            return origOverwriteCommand<keyof typeof ElementCommands, any, any>(
                name,
                runFnInFiberContext(fn),
                attachToElement,
                Object.getPrototypeOf(multibrowser.baseInstance),
                multibrowser.instances
            )
        }
    }

    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)
    return driver
}

export const SevereServiceError = SevereServiceErrorImport
export * from './types'
export * from './utils/interception/types'
