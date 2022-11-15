import { automationProtocolPath } from 'virtual:wdio'

import stringify from 'fast-safe-stringify'
import { expect } from 'expect-webdriverio'
import { remote } from 'webdriverio'
// @ts-expect-error
import { setupEnv as setupMocha } from '@wdio/mocha-framework/common'
import { _setGlobal } from '@wdio/globals'

type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>

declare global {
    interface Window {
        __wdioErrors__: WDIOErrorEvent[]
    }
}

window.__wdioErrors__ = []
addEventListener('error', (ev) => window.__wdioErrors__.push({
    filename: ev.filename,
    message: ev.message
}))

const wsUrl = 'ws://' + window.location.host + '/ws'
console.log(`[WDIO] Connect to testrunner: ${wsUrl}`)
export const socket = new WebSocket(wsUrl)
export const connectPromise = new Promise((resolve) => {
    console.log('[WDIO] Connected to testrunner')
    socket.addEventListener('open', () => resolve(socket))
})

let hookResolver = new Map<number, { resolve: Function, reject: Function }>()
function handleHookResult (payload: MessageEvent) {
    const result = JSON.parse(payload.data)
    if (result.type !== 'hook') {
        return
    }

    const resolver = hookResolver.get(result.id)
    if (!resolver) {
        return console.warn(`[WDIO] couldn't find resolve for id "${result.id}"`)
    }

    hookResolver.delete(result.id)
    if (result.error) {
        return resolver.reject(result.error)
    }
    return resolver.resolve(result.value)
}
socket.addEventListener('message', handleHookResult)
export function getHook (name: string) {
    return (...args: any[]) => new Promise((resolve, reject) => {
        const id = hookResolver.size + 1
        const [cid] = window.location.pathname.slice(1).split('/')
        if (!cid) {
            return reject(new Error('"cid" query parameter is missing'))
        }

        hookResolver.set(id, { resolve, reject })
        socket.send(stringify({ type: 'hook', name, id, cid, args }))
    })
}

export async function setupEnv () {
    const injectGlobals = window.__wdioEnv__.injectGlobals
    const browser = await remote({
        automationProtocol: automationProtocolPath as any,
        capabilities: window.__wdioEnv__.capabilities
    })
    _setGlobal('browser', browser, injectGlobals)
    _setGlobal('driver', browser, injectGlobals)
    _setGlobal('expect', expect, injectGlobals)
    _setGlobal('$', browser.$.bind(browser), injectGlobals)
    _setGlobal('$$', browser.$.bind(browser), injectGlobals)
}

export function setupHooks () {
    const [cid] = window.location.pathname.slice(1).split('/')
    if (!cid) {
        throw new Error('"cid" query parameter is missing')
    }

    const beforeHook = getHook('beforeHook')
    const beforeTest = getHook('beforeTest')
    const afterHook = getHook('afterHook')
    const afterTest = getHook('afterTest')
    setupMocha(cid, window.__wdioEnv__.args, beforeTest, beforeHook, afterTest, afterHook)
}
