import { automationProtocolPath } from 'virtual:wdio'

import { expect } from 'expect-webdriverio'
import { remote } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'

import './frameworks/mocha.js'
import { showPopupWarning } from './utils.js'
import type { MochaFramework } from './frameworks/mocha'

type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>
declare global {
    interface Window {
        Mocha?: any
        __wdioErrors__: WDIOErrorEvent[]
        __wdioSpec__: string
        __wdioFailures__: number
        __wdioEvents__: any[]
        __wdioSocket__: WebSocket
        __wdioConnectPromise__: Promise<WebSocket>
        __wdioMockCache__: Map<string, any>
    }
}

globalThis.alert = showPopupWarning('alert', undefined)
globalThis.confirm = showPopupWarning('confirm', false, true)
globalThis.prompt = showPopupWarning('prompt', null, 'your value')

/**
 * create connection to Vite server
 */
const wsUrl = 'ws://' + window.location.host + '/ws'
console.log(`[WDIO] Connect to testrunner: ${wsUrl}`)
export const socket = window.__wdioSocket__ = new WebSocket(wsUrl)
export const connectPromise = window.__wdioConnectPromise__ = new Promise<WebSocket>((resolve) => {
    console.log('[WDIO] Connected to testrunner')
    socket.addEventListener('open', () => resolve(socket))
})

/**
 * Setup fake browser instance and attach to global scope if necessary
 */
const browser = await remote({
    automationProtocol: automationProtocolPath as any,
    capabilities: window.__wdioEnv__.capabilities
})
_setGlobal('browser', browser, window.__wdioEnv__.injectGlobals)
_setGlobal('driver', browser, window.__wdioEnv__.injectGlobals)
_setGlobal('expect', expect, window.__wdioEnv__.injectGlobals)
_setGlobal('$', browser.$.bind(browser), window.__wdioEnv__.injectGlobals)
_setGlobal('$$', browser.$$.bind(browser), window.__wdioEnv__.injectGlobals)

/**
 * run framework immediatelly on page load
 */
const mochaFramework = document.querySelector('mocha-framework') as MochaFramework
if (mochaFramework) {
    const socket = await connectPromise
    mochaFramework.run(socket).catch((err) => {
        /**
         * On MacOS importing the spec file might fail with a null error object.
         * This is Vite doing a hot reload and the error is not relevant for us.
         */
        if (!err.stack) {
            return
        }

        return window.__wdioErrors__.push({
            message: `${err.message}: ${err.stack}`,
            filename: mochaFramework.spec
        })
    })
}
