import { resolveCustomCommandOptions, setWdioKind, webdriverMonad, wrapCommand } from '@wdio/utils'

import { $ } from './commands/browser/$.js'
import { $$ } from './commands/browser/$$.js'
import { custom$ } from './commands/browser/custom$.js'
import { custom$$ } from './commands/browser/custom$$.js'
import { react$ } from './commands/browser/react$.js'
import { react$$ } from './commands/browser/react$$.js'
import { execute } from './commands/browser/execute.js'
import { action } from './commands/browser/action.js'
import { actions } from './commands/browser/actions.js'
import { keys } from './commands/browser/keys.js'
import { scroll } from './commands/browser/scroll.js'
import { saveScreenshot } from './commands/browser/saveScreenshot.js'
import { savePDF } from './commands/browser/savePDF.js'
import { getCookies } from './commands/browser/getCookies.js'
import { setCookies } from './commands/browser/setCookies.js'
import { deleteCookies } from './commands/browser/deleteCookies.js'
import { setViewport } from './commands/browser/setViewport.js'
import { addInitScript } from './commands/browser/addInitScript.js'
import { mock } from './commands/browser/mock.js'
import { mockClearAll } from './commands/browser/mockClearAll.js'
import { mockRestoreAll } from './commands/browser/mockRestoreAll.js'
import { emulate } from './commands/browser/emulate.js'
import { restore } from './commands/browser/restore.js'
import { waitUntil } from './commands/browser/waitUntil.js'
import { pause } from './commands/browser/pause.js'
import { frame } from './commands/browsingContext/frame.js'
import { navigate } from './commands/browsingContext/navigate.js'
import { refresh } from './commands/browsingContext/refresh.js'
import { closeWindow, activate } from './commands/browsingContext/window.js'
import { back, forward } from './commands/browsingContext/history.js'
import { getTitle, getUrl } from './commands/browsingContext/document.js'
import { acceptAlert, dismissAlert, getAlertText } from './commands/browsingContext/dialog.js'
import { assertTopLevel } from './session/browsingContext.js'

const SESSION_FLAGS = [
    'isBidi',
    'isMobile',
    'isIOS',
    'isAndroid',
    'isFirefox',
    'isChrome',
    'isSafari'
] as const

export interface BrowsingContextInit {
    isFrame: boolean
    url: string
    parent?: WebdriverIO.BrowsingContext
    request?: WebdriverIO.Request
}

/**
 * Commands that stay session-wide. A frame cannot call them. A top-level
 * context runs them on the browser, which is where their session state lives.
 */
function onBrowser (command: string, fn: Function) {
    return async function (this: WebdriverIO.BrowsingContext, ...args: unknown[]) {
        assertTopLevel(this, command)
        return fn.apply(this.browser, args)
    }
}

function topLevel (command: string, fn: Function) {
    return async function (this: WebdriverIO.BrowsingContext, ...args: unknown[]) {
        assertTopLevel(this, command)
        return fn.apply(this, args)
    }
}

function rejectCommand (name: string) {
    return function () {
        return Promise.reject(new Error(
            `\`${name}\` is only available on the browser, not on a browsing context. ` +
            `Use \`browser.${name}(name, fn, { attachToBrowsingContext: true })\` to change the commands of every browsing context.`
        ))
    }
}

/**
 * Properties a browsing context sets itself. A custom command cannot use
 * these names.
 */
const RESERVED_PROPERTIES = new Set([
    'contextId', 'browser', 'isFrame', 'url', 'parent', 'request', 'capabilities',
    'strategies', 'sessionId', 'options', 'commandList', 'addCommand', 'overwriteCommand',
    'on', 'off', 'once', 'emit', 'removeListener', 'removeAllListeners',
    ...SESSION_FLAGS
])

/**
 * Names a custom command can never have. `then`, `catch` and `finally`
 * would make every context a thenable, so `await browser.url()` would call
 * the command instead of resolving to the context. The others are the
 * monad's own bookkeeping and object internals.
 */
const FORBIDDEN_COMMAND_NAMES = new Map([
    ['then', 'it would make every browsing context a thenable, and awaiting a command that returns a context would call it'],
    ['catch', 'it would make every browsing context look like a promise'],
    ['finally', 'it would make every browsing context look like a promise'],
    ['__propertiesObject__', 'WebdriverIO uses it internally'],
    ['__elementOverrides__', 'WebdriverIO uses it internally'],
    ['constructor', 'it is an object internal'],
    ['__proto__', 'it is an object internal']
])

function assertCommandName (command: 'addCommand' | 'overwriteCommand', name: string) {
    const reason = FORBIDDEN_COMMAND_NAMES.get(name)
    if (reason) {
        throw new Error(`${command}: a browsing context command cannot be named "${name}": ${reason}.`)
    }
}

/**
 * Custom commands registered with `attachToBrowsingContext: true` for one
 * browser. Contexts created later read `commands` and `overrides`. `contexts`
 * holds the contexts created so far, so a command registered later reaches
 * a context a test already holds.
 */
interface BrowsingContextCommands {
    commands: Map<string, Function>
    overrides: Map<string, Function[]>
    contexts: Set<WeakRef<WebdriverIO.BrowsingContext>>
    /**
     * drops the reference of a context once it was garbage collected
     */
    finalizer: FinalizationRegistry<WeakRef<WebdriverIO.BrowsingContext>>
}

const registries = new WeakMap<WebdriverIO.Browser, BrowsingContextCommands>()

function getRegistry (browser: WebdriverIO.Browser): BrowsingContextCommands {
    let registry = registries.get(browser)
    if (!registry) {
        const contexts = new Set<WeakRef<WebdriverIO.BrowsingContext>>()
        registry = {
            commands: new Map(),
            overrides: new Map(),
            contexts,
            finalizer: new FinalizationRegistry((ref) => contexts.delete(ref))
        }
        registries.set(browser, registry)
    }
    return registry
}

/**
 * The same `originalCommand` contract as `browser.overwriteCommand`: the
 * override gets the previous command, bound to the context, as its first
 * argument.
 */
function composeOverrides (base: Function, overrides: Function[] = []): Function {
    return overrides.reduce((previous, override) => {
        return function (this: WebdriverIO.BrowsingContext, ...args: unknown[]) {
            const context = this
            function originalCommand (this: unknown, ...originalArgs: unknown[]) {
                return previous.apply(this || context, originalArgs)
            }
            return override.call(context, originalCommand, ...args)
        }
    }, base)
}

/**
 * The command `name` as a context created now would carry it, before the
 * command wrapper is applied: the built-in or custom command with every
 * override composed on top.
 */
function resolveCommand (registry: BrowsingContextCommands, name: string): Function | undefined {
    const base = registry.commands.get(name) || commandProperties()[name]?.value
    if (typeof base !== 'function') {
        return undefined
    }
    return composeOverrides(base, registry.overrides.get(name))
}

function liveContexts (registry: BrowsingContextCommands): WebdriverIO.BrowsingContext[] {
    const contexts: WebdriverIO.BrowsingContext[] = []
    for (const ref of registry.contexts) {
        const context = ref.deref()
        if (context) {
            contexts.push(context)
        } else {
            registry.contexts.delete(ref)
        }
    }
    return contexts
}

function applyToLiveContexts (registry: BrowsingContextCommands, name: string) {
    const command = resolveCommand(registry, name)
    if (!command) {
        return
    }
    for (const context of liveContexts(registry)) {
        Object.defineProperty(context, name, {
            value: wrapCommand(name, command as (...args: unknown[]) => Promise<unknown>),
            configurable: true,
            writable: true
        })
    }
}

/**
 * `browser.addCommand(name, fn, { attachToBrowsingContext: true })`
 */
export function addBrowsingContextCommand (browser: WebdriverIO.Browser, name: string, fn: unknown) {
    if (typeof fn !== 'function') {
        throw new Error(`addCommand: the browsing context command "${name}" must be a function`)
    }
    assertCommandName('addCommand', name)
    if (RESERVED_PROPERTIES.has(name) || name in commandProperties()) {
        throw new Error(
            `addCommand: "${name}" is already a property of every browsing context. ` +
            'Use `overwriteCommand(name, fn, { attachToBrowsingContext: true })` to change a built-in command.'
        )
    }
    const registry = getRegistry(browser)
    registry.commands.set(name, fn)
    applyToLiveContexts(registry, name)
}

/**
 * `browser.overwriteCommand(name, fn, { attachToBrowsingContext: true })`
 */
export function overwriteBrowsingContextCommand (browser: WebdriverIO.Browser, name: string, fn: unknown) {
    if (typeof fn !== 'function') {
        throw new Error(`overwriteCommand: the browsing context command "${name}" must be overwritten with a function`)
    }
    assertCommandName('overwriteCommand', name)
    const registry = getRegistry(browser)
    if (!registry.commands.has(name) && typeof commandProperties()[name]?.value !== 'function') {
        throw new Error(`overwriteCommand: no browsing context command to be overwritten: ${name}`)
    }
    registry.overrides.set(name, [...(registry.overrides.get(name) || []), fn])
    applyToLiveContexts(registry, name)
}

/**
 * Route `attachToBrowsingContext` registrations of a browser to its browsing
 * contexts. Every other registration goes to the browser's own `addCommand`
 * and `overwriteCommand`.
 */
export function enableBrowsingContextCommands (browser: WebdriverIO.Browser) {
    const addCommand = browser.addCommand as Function
    const overwriteCommand = browser.overwriteCommand as Function
    browser.addCommand = function (this: WebdriverIO.Browser | undefined, name: string, fn: unknown, options?: unknown) {
        const resolved = resolveCustomCommandOptions('addCommand', options)
        if (resolved.attachToBrowsingContext) {
            return addBrowsingContextCommand(browser, name, fn)
        }
        return addCommand.call(this || browser, name, fn, resolved)
    } as WebdriverIO.Browser['addCommand']
    browser.overwriteCommand = function (this: WebdriverIO.Browser | undefined, name: string, fn: unknown, options?: unknown) {
        const resolved = resolveCustomCommandOptions('overwriteCommand', options)
        if (resolved.attachToBrowsingContext) {
            return overwriteBrowsingContextCommand(browser, name, fn)
        }
        return overwriteCommand.call(this || browser, name, fn, resolved)
    } as WebdriverIO.Browser['overwriteCommand']
}

function commandProperties (): Record<string, PropertyDescriptor> {
    /**
     * A fresh map every time. The monad wraps each function in place, so a
     * shared map would wrap the same command again for the next context.
     */
    const commands: Record<string, Function> = {
        $,
        $$,
        custom$,
        custom$$,
        react$,
        react$$,
        execute,
        action,
        actions,
        keys,
        scroll,
        saveScreenshot,
        savePDF,
        getCookies,
        setCookies,
        deleteCookies,
        setViewport,
        addInitScript,
        mock,
        mockClearAll: topLevel('mockClearAll', mockClearAll),
        mockRestoreAll: topLevel('mockRestoreAll', mockRestoreAll),
        waitUntil,
        pause,
        frame,
        navigate,
        refresh,
        closeWindow,
        activate,
        back,
        forward,
        getTitle,
        getUrl,
        acceptAlert,
        dismissAlert,
        getAlertText,
        emulate: onBrowser('emulate', emulate),
        restore: onBrowser('restore', restore)
    }
    const properties: Record<string, PropertyDescriptor> = {
        strategies: { value: null, writable: true }
    }
    for (const [name, value] of Object.entries(commands)) {
        properties[name] = { value, configurable: true }
    }
    return properties
}

/**
 * A browsing context for one tab, window, or frame. It carries the commands
 * that can target a navigable and the custom commands registered with
 * `browser.addCommand(name, fn, { attachToBrowsingContext: true })`. It does
 * not carry session commands, and `addCommand` stays on the browser.
 */
export function getBrowsingContext (
    browser: WebdriverIO.Browser,
    contextId: string,
    init: BrowsingContextInit
): WebdriverIO.BrowsingContext {
    const registry = getRegistry(browser)
    const monad = webdriverMonad({
        ...browser.options,
        capabilities: browser.capabilities
    }, (client: WebdriverIO.BrowsingContext) => {
        client.contextId = contextId
        client.browser = browser
        client.isFrame = init.isFrame
        client.url = init.url
        if (init.parent) {
            client.parent = init.parent
        }
        if (init.request) {
            client.request = init.request
        }
        client.capabilities = browser.capabilities
        client.strategies = browser.strategies
        const target = client as WebdriverIO.BrowsingContext & Record<(typeof SESSION_FLAGS)[number], boolean>
        const source = browser as WebdriverIO.Browser & Record<(typeof SESSION_FLAGS)[number], boolean>
        for (const flag of SESSION_FLAGS) {
            if (flag in browser) {
                target[flag] = source[flag]
            }
        }
        client.on = browser.on.bind(browser)
        client.off = browser.off.bind(browser)
        client.once = browser.once.bind(browser)
        client.emit = browser.emit.bind(browser)
        client.removeListener = browser.removeListener.bind(browser)
        client.removeAllListeners = browser.removeAllListeners.bind(browser)
        /**
         * not `'browser'`: a context has no session commands and no `addCommand`, see `@wdio/utils` `kind.ts`
         */
        return setWdioKind(client, 'browsing-context')
    }, contextProperties(registry))

    const context = monad(browser.sessionId, wrapCommand) as WebdriverIO.BrowsingContext
    context.addCommand = rejectCommand('addCommand')
    context.overwriteCommand = rejectCommand('overwriteCommand')
    const ref = new WeakRef(context)
    registry.contexts.add(ref)
    registry.finalizer.register(context, ref)
    return context
}

/**
 * The built-in commands plus the custom commands and overrides registered
 * for this browser's contexts. The monad applies the command wrapper once.
 */
function contextProperties (registry: BrowsingContextCommands): Record<string, PropertyDescriptor> {
    const properties = commandProperties()
    for (const [name, fn] of registry.commands) {
        properties[name] = { value: fn, configurable: true }
    }
    for (const [name, overrides] of registry.overrides) {
        const base = properties[name]?.value
        if (typeof base === 'function') {
            properties[name] = { value: composeOverrides(base, overrides), configurable: true }
        }
    }
    return properties
}
