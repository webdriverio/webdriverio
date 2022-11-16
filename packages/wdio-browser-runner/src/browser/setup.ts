import { automationProtocolPath } from 'virtual:wdio'

import { expect } from 'expect-webdriverio'
import { remote } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'

import { MochaFramework } from './frameworks/mocha.js'

type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>
declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
        __wdioSpec__: string
        __wdioFailures__: number
        __wdioEvents__: any[]
    }
}

/**
 * listen to window errors during bootstrap phase
 */
window.__wdioErrors__ = []
addEventListener('error', (ev) => window.__wdioErrors__.push({
    filename: ev.filename,
    message: ev.message
}))

/**
 * create connection to Vite server
 */
const wsUrl = 'ws://' + window.location.host + '/ws'
console.log(`[WDIO] Connect to testrunner: ${wsUrl}`)
export const socket = new WebSocket(wsUrl)
export const connectPromise = new Promise<WebSocket>((resolve) => {
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
_setGlobal('$$', browser.$.bind(browser), window.__wdioEnv__.injectGlobals)

/**
 * initiate framework execution once socket is connected
 */
await connectPromise.then(async (socket) => {
    const frameworkRunner = new MochaFramework(socket)

    /**
     * load spec file
     */
    await import(window.__wdioSpec__)

    /**
     * execute tests
     */
    await frameworkRunner.run()
})
