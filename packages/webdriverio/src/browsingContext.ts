import { webdriverMonad, wrapCommand } from '@wdio/utils'

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
        return Promise.reject(new Error(`\`${name}\` is only available on the browser, not on a browsing context`))
    }
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
 * that can target a navigable. It does not carry session commands, and
 * `addCommand` stays on the browser.
 */
export function getBrowsingContext (
    browser: WebdriverIO.Browser,
    contextId: string,
    init: BrowsingContextInit
): WebdriverIO.BrowsingContext {
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
        return client
    }, commandProperties())

    const context = monad(browser.sessionId, wrapCommand) as WebdriverIO.BrowsingContext
    context.addCommand = rejectCommand('addCommand')
    context.overwriteCommand = rejectCommand('overwriteCommand')
    return context
}
