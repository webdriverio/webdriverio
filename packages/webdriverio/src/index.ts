/// <reference types="@wdio/types"/>

import logger from '@wdio/logger'
import type * as WebDriverTypes from 'webdriver'
import WebDriver from 'webdriver'
import { DEFAULTS } from 'webdriver'
import { validateConfig, detectBackend } from '@wdio/config'
import { wrapCommand, runFnInFiberContext } from '@wdio/utils'
import { Options, Capabilities } from '@wdio/types'

import MultiRemote from './multiremote'
import type ElementCommands from './commands/element'
import SevereServiceErrorImport from './utils/SevereServiceError'
import { WDIO_DEFAULTS } from './constants'
import {
    getPrototype, addLocatorStrategyHandler, isStub, getAutomationProtocol,
    updateCapabilities
} from './utils'
import {
    MultiRemoteBrowser,
    Browser as BrowserType,
    Element as ElementType,
    MultiRemoteBrowser as MultiRemoteBrowserType,
    TouchAction as TouchActionImport
} from './types'
import {
    MockOverwriteFunction as MockOverwriteFunctionImport,
    MockOverwrite as MockOverwriteImport
} from './utils/interception/types'

type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities'>

/**
 * A method to create a new session with WebdriverIO
 *
 * @param  {Object} [params={}]       Options to create the session with
 * @param  {function} remoteModifier  Modifier function to change the monad object
 * @return {object}                   browser object with sessionId
 */
export const remote = async function (params: RemoteOptions, remoteModifier?: Function) {
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

    if (params.user && params.key) {
        params = Object.assign({}, detectBackend(params), params)
    }

    const prototype = getPrototype('browser')
    const ProtocolDriver = require(automationProtocol).default

    await updateCapabilities(params, automationProtocol)
    const instance: BrowserType = await ProtocolDriver.newSession(params, modifier, prototype, wrapCommand)

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

export const attach = function (params: WebDriverTypes.AttachOptions) {
    const prototype = getPrototype('browser')
    return WebDriver.attachToSession(params, undefined, prototype, wrapCommand) as BrowserType
}

export const multiremote = async function (
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
) {
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
    ) as MultiRemoteBrowser

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

declare global {
    namespace WebdriverIO {
        interface Browser extends BrowserType {}
        interface Element extends ElementType {}

        type MultiRemoteBrowser = MultiRemoteBrowserType
        type TouchAction = TouchActionImport
        type ClickOptions = Required<Parameters<ElementType['click']>[0]>
        type MockOverwriteFunction = MockOverwriteFunctionImport
        type MockOverwrite = MockOverwriteImport
    }

    module NodeJS {
        interface Global {
            browser: BrowserType | MultiRemoteBrowserType
            driver: BrowserType | MultiRemoteBrowserType
        }
    }

    function $(...args: Parameters<BrowserType['$']>): ReturnType<BrowserType['$']>
    function $$(...args: Parameters<BrowserType['$$']>): ReturnType<BrowserType['$$']>
}
