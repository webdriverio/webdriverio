import fs from 'node:fs'
import path from 'node:path'

import { SessionError, usage } from '../errors.js'
import { cliCmd, type Cmd } from '../hints.js'
import { quote } from '../quote.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

type SessionCookie = Awaited<ReturnType<WebdriverIO.Browser['getCookies']>>[number]
type SameSite = NonNullable<SessionCookie['sameSite']>
const SAME_SITE = new Set<SameSite>(['lax', 'strict', 'none', 'default'])

interface SavedState {
    version: 1
    url: string
    origin: string
    cookies: SessionCookie[]
    localStorage: Record<string, string>
    sessionStorage: Record<string, string>
}

const done = (text: string, code?: string): ActionOutcome => ({ text, ...(code ? { code, history: code } : {}) })

export function cookieOptions (args: Record<string, unknown>, cmd: Cmd = cliCmd): SessionCookie {
    const name = String(args.name ?? '')
    const value = args.value === undefined ? undefined : String(args.value)
    if (!name || value === undefined) {
        throw usage('Pass a cookie name and value.', `Example: ${cmd('cookies', { sub: 'set', name: 'session', value: 'abc' }, 'wdio session cookies set session abc')}`)
    }
    const cookie: SessionCookie = { name, value }
    if (typeof args.domain === 'string') {
        cookie.domain = args.domain
    }
    if (typeof args.path === 'string') {
        cookie.path = args.path
    }
    if (args.httpOnly) {
        cookie.httpOnly = true
    }
    if (args.secure) {
        cookie.secure = true
    }
    if (args.sameSite !== undefined) {
        const sameSite = String(args.sameSite).toLowerCase() as SameSite
        if (!SAME_SITE.has(sameSite)) {
            throw usage(`Unknown sameSite "${args.sameSite}".`, 'Use lax, strict, none or default.')
        }
        cookie.sameSite = sameSite
    }
    if (args.expiry !== undefined) {
        const expiry = Number(args.expiry)
        if (!Number.isFinite(expiry)) {
            throw usage(`Invalid expiry "${args.expiry}".`, 'Use a Unix timestamp in seconds.')
        }
        cookie.expiry = expiry
    }
    return cookie
}

function cookieLiteral (cookie: SessionCookie) {
    const fields = Object.entries(cookie).map(([key, value]) => `${key}: ${typeof value === 'string' ? quote(value) : value}`)
    return `{ ${fields.join(', ')} }`
}

function linesOf (record: Record<string, string>) {
    return Object.keys(record).sort().map((key) => `${key}=${record[key]}`)
}

async function readStorage (session: Session, useSession: boolean) {
    return session.browser.execute((sessionStorage) => {
        const store = sessionStorage ? window.sessionStorage : window.localStorage
        const out: Record<string, string> = {}
        for (let i = 0; i < store.length; i++) {
            const key = store.key(i)
            if (key !== null) {
                out[key] = store.getItem(key) ?? ''
            }
        }
        return out
    }, useSession)
}

const storeName = (useSession: boolean) => useSession ? 'sessionStorage' : 'localStorage'

export const cookies: ActionFn = async (session, args) => {
    const sub = args.sub as string | undefined
    const { browser } = session
    if (sub === 'set') {
        const cookie = cookieOptions(args, session.cmd)
        await browser.setCookies(cookie)
        return done(`Set cookie ${cookie.name}`, `await browser.setCookies(${cookieLiteral(cookie)})`)
    }
    if (sub === 'clear') {
        const name = typeof args.name === 'string' ? args.name : undefined
        await browser.deleteCookies(name)
        return done(name ? `Cleared cookie ${name}` : 'Cleared cookies', name ? `await browser.deleteCookies(${quote(name)})` : 'await browser.deleteCookies()')
    }
    const name = sub === 'get' ? args.name : sub
    const filter = typeof name === 'string' && name ? { name } : undefined
    const list = await browser.getCookies(filter)
    if (filter) {
        const found = list.find((cookie) => cookie.name === filter.name)
        if (!found) {
            throw new SessionError('NO_MATCH', `No cookie ${JSON.stringify(filter.name)}.`)
        }
        return { text: found.value, data: { cookie: found } }
    }
    return {
        text: list.length ? list.map((cookie) => `${cookie.name}=${cookie.value}`).join('\n') : 'No cookies.',
        data: { cookies: list }
    }
}

export const storage: ActionFn = async (session, args) => {
    const useSession = Boolean(args.sessionStorage)
    const which = storeName(useSession)
    const sub = args.sub as string | undefined
    const { browser } = session
    if (sub === 'set') {
        const key = String(args.key ?? '')
        if (!key || args.value === undefined) {
            throw usage('Pass a key and a value.', `Example: ${session.cmd('storage', { sub: 'set', key: 'token', value: 'abc', ...(useSession ? { sessionStorage: true } : {}) }, `wdio session storage set token abc${useSession ? ' --session-storage' : ''}`)}`)
        }
        const value = String(args.value)
        await browser.execute((sessionStorage, storageKey, storageValue) => {
            (sessionStorage ? window.sessionStorage : window.localStorage).setItem(storageKey, storageValue)
        }, useSession, key, value)
        return done(`Set ${which} ${key}`, `await browser.execute(() => ${which}.setItem(${quote(key)}, ${quote(value)}))`)
    }
    if (sub === 'clear') {
        const key = typeof args.key === 'string' ? args.key : undefined
        await browser.execute((sessionStorage, storageKey) => {
            const store = sessionStorage ? window.sessionStorage : window.localStorage
            if (storageKey) {
                store.removeItem(storageKey)
            } else {
                store.clear()
            }
        }, useSession, key || null)
        const call = key ? `${which}.removeItem(${quote(key)})` : `${which}.clear()`
        return done(key ? `Cleared ${which} ${key}` : `Cleared ${which}`, `await browser.execute(() => ${call})`)
    }
    const key = sub === 'get' ? args.key : sub
    const record = await readStorage(session, useSession)
    if (typeof key === 'string' && key) {
        if (!(key in record)) {
            throw new SessionError('NO_MATCH', `No ${which} key ${JSON.stringify(key)}.`)
        }
        return { text: record[key], data: { key, value: record[key] } }
    }
    const lines = linesOf(record)
    return { text: lines.length ? lines.join('\n') : `No ${which} entries.`, data: { storage: record } }
}

export const state: ActionFn = async (session, args) => {
    const file = path.resolve(String(args.$cwd || session.cwd), String(args.file ?? ''))
    if (!args.file) {
        throw usage('Pass a file.', `Example: ${session.cmd('state', { sub: 'save', file: 'state.json' }, 'wdio session state save state.json')}`)
    }
    if (args.sub === 'save') {
        const url = await session.browser.getUrl()
        const saved: SavedState = {
            version: 1,
            url,
            origin: new URL(url).origin,
            cookies: await session.browser.getCookies(),
            localStorage: await readStorage(session, false),
            sessionStorage: await readStorage(session, true)
        }
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(saved, null, 2) + '\n', { mode: 0o600 })
        if (process.platform !== 'win32') {
            fs.chmodSync(file, 0o600)
        }
        return {
            text: `Saved ${saved.cookies.length} cookies, ${Object.keys(saved.localStorage).length} localStorage, ${Object.keys(saved.sessionStorage).length} sessionStorage → ${file}`,
            data: { file, ...saved },
            files: [file]
        }
    }
    if (!fs.existsSync(file)) {
        throw new SessionError('NO_MATCH', `State file ${file} does not exist.`)
    }
    const saved = JSON.parse(fs.readFileSync(file, 'utf-8')) as SavedState
    if (saved.version !== 1 || !saved.url || !saved.origin) {
        throw usage(`State file ${file} is not a version 1 session state.`)
    }
    const current = await session.currentUrl()
    let origin = ''
    try {
        origin = new URL(current || '').origin
    } catch {
        origin = ''
    }
    if (origin !== saved.origin) {
        await session.browser.url(saved.url)
    }
    await session.browser.deleteCookies()
    if (saved.cookies.length) {
        await session.browser.setCookies(saved.cookies.map((cookie) => cookieOptions({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite === 'lax' || cookie.sameSite === 'strict' || cookie.sameSite === 'none' ? cookie.sameSite : undefined,
            expiry: cookie.expiry
        })))
    }
    await session.browser.execute((local, sessionValues) => {
        localStorage.clear()
        sessionStorage.clear()
        for (const [key, value] of Object.entries(local)) {
            localStorage.setItem(key, value)
        }
        for (const [key, value] of Object.entries(sessionValues)) {
            sessionStorage.setItem(key, value)
        }
    }, saved.localStorage || {}, saved.sessionStorage || {})
    await session.browser.refresh()
    return done(
        `Restored ${saved.cookies.length} cookies, ${Object.keys(saved.localStorage || {}).length} localStorage, ${Object.keys(saved.sessionStorage || {}).length} sessionStorage for ${saved.origin}`,
        `await browser.url(${quote(saved.url)})\nawait browser.setCookies(${JSON.stringify(saved.cookies)})\nawait browser.refresh()`
    )
}
