import logger from '@wdio/logger'

import WebDriver from 'webdriver'
import { DEFAULTS } from 'webdriver'
import { validateConfig } from '@wdio/config'
import { wrapCommand } from '@wdio/utils'
import { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'

import MultiRemote from './multiremote.js'
import type ElementCommands from './commands/element.js'
import SevereServiceErrorImport from './utils/SevereServiceError.js'
import detectBackend from './utils/detectBackend.js'
import { WDIO_DEFAULTS } from './constants.js'
import {
    getPrototype, addLocatorStrategyHandler, isStub, getAutomationProtocol,
    updateCapabilities
} from './utils/index.js'
import type { AttachOptions } from './types'

export type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities'>

/**
 * A method to create a new session with WebdriverIO.
 *
 * <b>
 * NOTE: If you hit "error TS2694: Namespace 'global.WebdriverIO' has no exported member 'Browser'" when using typescript,
 * add "webdriverio/async" into tsconfig.json's "types" array will solve it: <code> { "compilerOptions": { "types": ["webdriverio/async"] } } </code>
 * </b>
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 * @see <a href="https://webdriver.io/docs/typescript">Typescript setup</a>
 */
export const remote = async function (params: RemoteOptions, remoteModifier?: Function): Promise<WebdriverIO.Browser> {
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
        instance.addCommand = (name: string, fn: (...args: any[]) => any, attachToElement) => (
            origAddCommand(name, fn, attachToElement)
        )

        const origOverwriteCommand = instance.overwriteCommand.bind(instance)
        instance.overwriteCommand = (name: string, fn: (...args: any[]) => any, attachToElement) => (
            origOverwriteCommand<keyof typeof ElementCommands, any, any>(name, fn, attachToElement)
        )
    }

    instance.addLocatorStrategy = addLocatorStrategyHandler(instance)
    return instance
}

export const attach = async function (attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
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

/**
 * WebdriverIO allows you to run multiple automated sessions in a single test.
 * This is handy when you’re testing features that require multiple users (for example, chat or WebRTC applications).
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
    params: Capabilities.MultiRemoteCapabilities,
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
        driver.addCommand = (name: string, fn: (...args: any[]) => any, attachToElement) => {
            return origAddCommand(
                name,
                fn,
                attachToElement,
                Object.getPrototypeOf(multibrowser.baseInstance),
                multibrowser.instances
            )
        }

        const origOverwriteCommand = driver.overwriteCommand.bind(driver)
        driver.overwriteCommand = (name: string, fn: (...args: any[]) => any, attachToElement) => {
            return origOverwriteCommand<keyof typeof ElementCommands, any, any>(
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

export const SevereServiceError = SevereServiceErrorImport
export * from './types.js'
export * from './utils/interception/types.js'
