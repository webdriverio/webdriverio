/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from '@wdio/logger'

import WebDriver, { DEFAULTS } from 'webdriver'
import { validateConfig } from '@wdio/config'
import { enableFileLogging, wrapCommand, isBidi, resolveCustomCommandOptions } from '@wdio/utils'
import type { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'

import MultiRemote from './multiRemote.js'
import SevereServiceErrorImport from './utils/SevereServiceError.js'
import detectBackend from './utils/detectBackend.js'
import { getProtocolDriver } from './utils/driver.js'
import { WDIO_DEFAULTS, Key as KeyConstant } from './constants.js'
import { getPrototype, addLocatorStrategyHandler, isStub } from './utils/index.js'
import { registerSessionManager } from './session/index.js'
import { enableBrowsingContextCommands } from './browsingContext.js'
import { getContextManager } from './session/context.js'
import { environment } from './environment.js'

import { isBidiCommandsEnabled } from './utils/bidi/elementCommands.js'
import type { AttachOptions, CustomCommandOptions } from './types.js'
import { IMPLICIT_WAIT_EXCLUSION_LIST } from './middlewares.js'

export * from './types.js'
export { PARALLEL_CONTEXT_STORE_KEY } from './session/context.js'
export const Key = KeyConstant
export const SevereServiceError = SevereServiceErrorImport
/**
 * Thrown by `$` when the selector matches more than one element and strict mode
 * is enabled, see https://webdriver.io/docs/selectors#strict-mode
 */
export { StrictSelectorError } from './utils/strictMode.js'
/**
 * The session's context pointer. The session REPL uses this to aim
 * `browser.$` and `browser.execute` at a frame it is holding. Public
 * commands do not move that pointer.
 */
export { getContextManager } from './session/context.js'
/**
 * Device descriptors used by `browser.emulate('device', name)`
 */
export { deviceDescriptorsSource, type DeviceName } from './deviceDescriptorsSource.js'
/**
 * Brands of WebdriverIO objects: `value[WDIO_KIND]` is `'browser'`, `'element'`,
 * `'element-array'`, `'mock'` or `'browsing-context'`, and `value[WDIO_CHAINABLE]` is
 * `true` on an unresolved `$()`.
 * They are `Symbol.for('wdio.kind')` and `Symbol.for('wdio.chainable')`, so other
 * packages can read them without an import.
 */
export { WDIO_KIND, WDIO_CHAINABLE, type WdioKind } from '@wdio/utils'

/**
 * Install Bidi-aware overwrites for protocol commands that need Bidi-specific
 * mechanisms.  Each overwrite checks `isBidiCommandsEnabled(this)` at call time:
 * the Bidi path uses a Bidi-only API (script.evaluate, browsingContext.getTree),
 * while the non-Bidi fallback calls `origCommand()` — the untouched protocol
 * endpoint — so mock services and classic WebDriver keep working without any
 * changes.
 *
 * The `isBidiCommandsEnabled` gate requires both `browser.isBidi` AND the
 * `'wdio:experimentalBiDiCommands': true` capability flag.  Mock sessions
 * (which are Bidi-capable but don't set the experimental flag) fall through
 * to the classic `origCommand()` path.
 *
 * Centralising these overwrites here (rather than in separate command files)
 * makes it easier to spot and manage Bidi-vs-classic inconsistencies across
 * browser-level getters.
 */
function applyBidiBrowserOverwrites(browser: WebdriverIO.Browser) {
    /**
     * Skip in unit tests — the browser object is a Vitest mock without a real
     * session, overwriteCommand chain, or ContextManager backing store.
     */
    if (environment.value.variables.WDIO_UNIT_TESTS) {
        return
    }

    /**
     * Skip protocol-stub sessions (e.g. the runner's capability-filtering
     * pass which sets `automationProtocol: './protocol-stub.js'`).  The
     * runner transfers the stub's `overwrittenCommands` onto the real
     * browser, so closures registered here must not capture the stub's
     * ContextManager — hence the call-time `getContextManager(this)`
     * resolution below (same pattern as the `url` command).
     */
    if (isStub((browser.options as { automationProtocol?: string } | undefined)?.automationProtocol)) {
        return
    }

    const overwrite = browser.overwriteCommand.bind(browser) as (name: string, fn: Function) => void

    overwrite('getTitle', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const result = await this.scriptEvaluate({
                expression: 'document.title',
                target: { context },
                awaitPromise: false
            })
            return (result as { result: { value: string } }).result?.value || ''
        }
        return origCommand()
    })

    overwrite('getUrl', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const tree = await this.browsingContextGetTree({ root: context })
            return tree.contexts[0]?.url || ''
        }
        return origCommand()
    })

    overwrite('getPageSource', async function (this: WebdriverIO.Browser, origCommand: () => Promise<string>) {
        if (isBidiCommandsEnabled(this)) {
            const context = await getContextManager(this).getCurrentContext()
            const result = await this.scriptEvaluate({
                expression: 'document.documentElement.outerHTML',
                target: { context },
                awaitPromise: false
            })
            return (result as { result: { value: string } }).result?.value || ''
        }
        return origCommand()
    })
}

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
export const remote = async function (
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
    if (!isStub(options.automationProtocol)) {
        enableBrowsingContextCommands(instance)
    }

    /**
     * we need to overwrite the original addCommand and overwriteCommand
     */
    if ((params as Options.Testrunner).framework && !isStub(params.automationProtocol)) {
        instance.addCommand = instance.addCommand.bind(instance)
        instance.overwriteCommand = instance.overwriteCommand.bind(instance)
    }

    instance.addLocatorStrategy = addLocatorStrategyHandler(instance)

    /**
     * protocol stub sessions are used before the real session starts (e.g. spec filtering).
     * They don't have full command coverage, so skip session manager initialization.
     */
    if (!isStub(options.automationProtocol)) {
        await registerSessionManager(instance)
    }

    applyBidiBrowserOverwrites(instance)

    return instance
}

export const attach = async function (attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
    /**
     * copy instances properties into new object
     */
    const params: Capabilities.WebdriverIOConfig & { requestedCapabilities: Capabilities.RequestedStandaloneCapabilities } = {
        automationProtocol: 'webdriver',
        ...detectBackend(attachOptions.options),
        ...attachOptions.options,
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
    enableBrowsingContextCommands(driver)
    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)

    /**
     * Wait for the Bidi handler to be connected before registering the session manager
     */
    if (isBidi(driver.capabilities) && '_bidiHandler' in driver) {
        await (driver['_bidiHandler'] as WebDriverTypes.BidiHandler).waitForConnected()
    }
    await registerSessionManager(driver)

    applyBidiBrowserOverwrites(driver)

    return driver
}

/**
 * WebdriverIO allows you to run multiple automated sessions in a single test.
 * This is handy when you're testing features that require multiple users (for example, chat or WebRTC applications).
 *
 * Instead of creating a couple of remote instances where you need to execute common commands like newSession() or url() on each instance,
 * you can simply create a multi-remote instance and control all browsers at the same time.
 *
 * <b>
 * NOTE: Multi-remote is not meant to execute all your tests in parallel.
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
export const multiRemote = async function (
    params: Capabilities.RequestedMultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<WebdriverIO.MultiRemoteBrowser> {
    const multibrowser = new MultiRemote()
    const browserNames = Object.keys(params)

    /**
     * create all instance sessions, then register them in capability order.
     * `Promise.all` keeps result order even when the sessions resolve out of order.
     * The first failure closes sessions that already started and rejects
     * immediately. A session that is still connecting closes itself when it
     * starts, so a live browser is not left open for the rest of that retry.
     */
    const started: WebdriverIO.Browser[] = []
    let startupFailed = false
    const pending = browserNames.map(async (browserName) => {
        const instance = await remote(params[browserName])
        if (startupFailed) {
            await instance.deleteSession()
            return [browserName, instance] as const
        }
        started.push(instance)
        return [browserName, instance] as const
    })
    let sessions: (readonly [string, WebdriverIO.Browser])[]
    try {
        sessions = await Promise.all(pending)
    } catch (err) {
        startupFailed = true
        const orphaned = started.splice(0)
        void Promise.allSettled(pending).then(() => {
            return Promise.allSettled(started.splice(0).map((instance) => instance.deleteSession()))
        })
        await Promise.allSettled(orphaned.map((instance) => instance.deleteSession()))
        throw err
    }
    for (const [browserName, instance] of sessions) {
        await multibrowser.addInstance(browserName, instance)
    }

    /**
     * use attachToSession capability to wrap instances around blank pod
     */
    const prototype = getPrototype('browser')
    const firstBrowser = multibrowser.instances.get(browserNames[0])
    const sessionParams = isStub(automationProtocol) || !firstBrowser ? undefined : {
        sessionId: '',
        logLevel: firstBrowser.options.logLevel
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
     * in order to get custom command overwritten or added to multi-remote instance
     * we need to pass in the prototype of the multibrowser
     */
    if (!isStub(automationProtocol)) {
        const origAddCommand = driver.addCommand.bind(driver)
        driver.addCommand = function (name: string, fn: any, options?: CustomCommandOptions<boolean>): void {
            const resolved = resolveCustomCommandOptions('addCommand', options)

            driver.instances.forEach(instanceName =>
                driver.getInstance(instanceName).addCommand(name, fn, resolved)
            )

            /**
             * browsing contexts belong to the instances, the multi-remote
             * object has none
             */
            if (resolved.attachToBrowsingContext) {
                return
            }

            return origAddCommand(
                name,
                fn,
                {
                    attachToElement: resolved.attachToElement,
                    proto: Object.getPrototypeOf(multibrowser.baseInstance),
                    instances: Object.fromEntries(multibrowser.instances)
                }
            )
        }

        const origOverwriteCommand = driver.overwriteCommand.bind(driver) as Function
        driver.overwriteCommand = ((name: string, fn: Function, options?: CustomCommandOptions<boolean>) => {
            const resolved = resolveCustomCommandOptions('overwriteCommand', options)
            if (resolved.attachToBrowsingContext) {
                driver.instances.forEach(instanceName =>
                    (driver.getInstance(instanceName).overwriteCommand as Function)(name, fn, resolved)
                )
                return
            }
            return origOverwriteCommand(
                name,
                fn,
                {
                    attachToElement: resolved.attachToElement,
                    proto: Object.getPrototypeOf(multibrowser.baseInstance),
                    instances: Object.fromEntries(multibrowser.instances)
                }
            )
        }) as typeof driver.overwriteCommand
    }

    driver.addLocatorStrategy = addLocatorStrategyHandler(driver)
    return driver
}
