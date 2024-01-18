/// <reference types="vite/client" />
import { automationProtocolPath } from 'virtual:wdio'

import { expect } from 'expect-webdriverio'
import { remote } from 'webdriverio'
import { _setGlobal } from '@wdio/globals'

import './frameworks/mocha.js'
import { showPopupWarning } from './utils.js'
import type { MochaFramework } from './frameworks/mocha.js'

type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>
declare global {
    interface Window {
        Mocha?: any
        WDIO_EVENT_NAME: string
        __wdioErrors__: WDIOErrorEvent[]
        __wdioSpec__: string
        __wdioMockCache__: Map<string, any>
    }
}

globalThis.alert = showPopupWarning('alert', undefined)
globalThis.confirm = showPopupWarning('confirm', false, true)
globalThis.prompt = showPopupWarning('prompt', null, 'your value')

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
 * run framework immediately on page load
 */
const mochaFramework = document.querySelector('mocha-framework') as MochaFramework
if (mochaFramework) {
    mochaFramework.run().catch((err) => {
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
