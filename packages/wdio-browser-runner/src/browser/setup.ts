import { automationProtocolPath } from 'virtual:wdio'

import { expect } from 'expect-webdriverio'
import { remote } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'

import './frameworks/mocha.js'
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
        __wdioMockFactories__: Record<string, any>
    }
}

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

const mochaFramework = document.querySelector('mocha-framework') as MochaFramework
if (mochaFramework) {
    await connectPromise
    mochaFramework.run(socket)
}
