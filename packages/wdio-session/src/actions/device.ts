import path from 'node:path'

import { usage } from '../errors.js'
import { quote } from '../quote.js'
import type { ActionFn } from '../session.js'

const done = (text: string, code: string) => ({ text, code, history: code })

const APP_STATE = ['not installed', 'not running', 'background (suspended)', 'background', 'foreground']

function appArgs (sessionPlatform: string, caps: Record<string, unknown>, id: string) {
    const name = String(caps.platformName || '').toLowerCase()
    const ios = sessionPlatform === 'desktop' ? name === 'mac' : name === 'ios'
    return ios ? { bundleId: id } : { appId: id }
}

export const app: ActionFn = async (session, args) => {
    const sub = String(args.sub || '')
    const id = String(args.id ?? '')
    if (!id) {
        throw usage('Pass an app id.')
    }
    const { browser } = session
    const caps = browser.capabilities as Record<string, unknown>
    const payload = appArgs(session.platform, caps, id)
    if (sub === 'launch') {
        await browser.execute('mobile: activateApp', payload)
        return done(`Launched ${id}`, `await browser.execute('mobile: activateApp', ${JSON.stringify(payload)})`)
    }
    if (sub === 'terminate') {
        await browser.execute('mobile: terminateApp', payload)
        return done(`Terminated ${id}`, `await browser.execute('mobile: terminateApp', ${JSON.stringify(payload)})`)
    }
    if (sub === 'install') {
        const file = path.resolve(String(args.$cwd || session.cwd), id)
        await browser.installApp(file)
        return done(`Installed ${path.basename(file)}`, `await browser.installApp(${quote(file)})`)
    }
    if (sub === 'state') {
        const value = await browser.execute('mobile: queryAppState', { appId: id, bundleId: id })
        const index = typeof value === 'number' ? value : Number(value)
        const label = APP_STATE[index] || String(value)
        return done(`${id}: ${label}`, `await browser.execute('mobile: queryAppState', { appId: ${quote(id)}, bundleId: ${quote(id)} })`)
    }
    throw usage(`Unknown app command "${sub}".`, 'Use launch, terminate, install or state.')
}

export const deeplink: ActionFn = async (session, args) => {
    const url = String(args.url ?? '')
    if (!url) {
        throw usage('Pass a URL.')
    }
    const pkg = typeof args.package === 'string' ? args.package : ''
    if (!pkg) {
        throw usage('Pass --package <id>.', 'Android needs the package name, iOS the bundle id.')
    }
    await session.browser.deepLink(url, pkg)
    return done(`Opened ${url}`, `await browser.deepLink(${quote(url)}, ${quote(pkg)})`)
}

export const rotate: ActionFn = async (session, args) => {
    const orientation = String(args.orientation || '').toUpperCase()
    try {
        await session.browser.setAppiumOrientation(orientation as 'PORTRAIT')
        return done(`Rotated to ${orientation.toLowerCase()}`, `await browser.setAppiumOrientation(${quote(orientation)})`)
    } catch {
        await session.browser.setOrientation(orientation as 'PORTRAIT')
        return done(`Rotated to ${orientation.toLowerCase()}`, `await browser.setOrientation(${quote(orientation)})`)
    }
}

export const keyboard: ActionFn = async (session) => {
    await session.browser.hideKeyboard()
    return done('Hid the keyboard', 'await browser.hideKeyboard()')
}

export const background: ActionFn = async (session, args) => {
    const seconds = Number(args.seconds)
    if (!Number.isFinite(seconds)) {
        throw usage('Pass a number of seconds.', 'Use -1 to keep the app in the background.')
    }
    await session.browser.background(seconds)
    return done(`Backgrounded for ${seconds}s`, `await browser.background(${seconds})`)
}

export const lock: ActionFn = async (session) => {
    await session.browser.lock()
    return done('Locked the device', 'await browser.lock()')
}

export const unlock: ActionFn = async (session) => {
    await session.browser.unlock()
    return done('Unlocked the device', 'await browser.unlock()')
}
