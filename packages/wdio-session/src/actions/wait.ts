import { usage } from '../errors.js'
import { quote } from '../daemon/init.js'
import { refId } from '../snapshot/refs.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const DEFAULT_LIMIT = 10_000
const MAX_SLEEP_MS = 30_000
const NETWORK_QUIET_MS = 500
const URL_META = new Set(['.', '+', '?', '^', '$', '(', ')', '|', '[', ']', '\\', '{', '}'])

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

/**
 * A double-star glob matches across path segments. A single star is one
 * segment. A pattern with no star is a substring.
 */
export function urlGlob (pattern: string) {
    let body = ''
    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === '*' && pattern[i + 1] === '*') {
            body += '.*'
            i++
        } else if (pattern[i] === '*') {
            body += '[^/]*'
        } else {
            body += URL_META.has(pattern[i]) ? '\\' + pattern[i] : pattern[i]
        }
    }
    return `^${body}$`
}

export function matchUrl (pattern: string, url: string) {
    if (!pattern.includes('*')) {
        return url.includes(pattern)
    }
    return new RegExp(urlGlob(pattern)).test(url)
}

async function waiter (session: Session, target: string) {
    if (refId(target)) {
        const resolved = await resolveTarget(session, target)
        return resolved
    }
    const element = await session.browser.$(target)
    return { element, code: `$(${quote(target)})`, label: JSON.stringify(target) }
}

export const wait: ActionFn = async (session, args) => {
    const limit = typeof args.limit === 'number' ? args.limit : DEFAULT_LIMIT
    if (!Number.isFinite(limit) || limit < 0) {
        throw usage('--limit must be a positive number of milliseconds.')
    }
    const modes = [
        args.text !== undefined ? 'text' : '',
        args.url !== undefined ? 'url' : '',
        args.load !== undefined ? 'load' : '',
        args.fn !== undefined ? 'fn' : '',
        args.target !== undefined ? 'target' : ''
    ].filter(Boolean)
    if (modes.length !== 1) {
        throw usage('Say what to wait for.', 'Pass milliseconds, a selector, --text, --url, --load or --fn.')
    }
    const timeoutMsg = (what: string) => `${what} (waited ${limit}ms)`
    const options = (what: string) => ({ timeout: limit, timeoutMsg: timeoutMsg(what) })

    if (args.fn !== undefined) {
        const expression = String(args.fn)
        if (!expression) {
            throw usage('Pass a JavaScript condition to --fn.')
        }
        const script = `return Boolean(${expression})`
        await session.browser.waitUntil(
            async () => Boolean(await session.browser.execute(script)),
            options(`Condition was not true: ${expression}`)
        )
        return done(`Condition is true: ${expression}`, `await browser.waitUntil(async () => Boolean(await browser.execute(${quote(script)})))`)
    }
    if (args.text !== undefined) {
        const text = String(args.text)
        await session.browser.waitUntil(async () => {
            const body = await session.browser.$('body').getText()
            return body.includes(text)
        }, options(`Text ${JSON.stringify(text)} did not appear`))
        return done(`Text appeared: ${text}`, `await browser.waitUntil(async () => (await $('body').getText()).includes(${quote(text)}))`)
    }
    if (args.url !== undefined) {
        const pattern = String(args.url)
        await session.browser.waitUntil(
            async () => matchUrl(pattern, await session.browser.getUrl()),
            options(`URL did not match ${pattern}`)
        )
        const check = pattern.includes('*')
            ? `new RegExp(${quote(urlGlob(pattern))}).test(await browser.getUrl())`
            : `(await browser.getUrl()).includes(${quote(pattern)})`
        return done(`URL matches ${pattern}`, `await browser.waitUntil(async () => ${check})`)
    }
    if (args.load !== undefined) {
        const load = String(args.load)
        if (load !== 'domcontentloaded' && load !== 'load' && load !== 'networkidle') {
            throw usage(`Unknown load state "${load}".`, 'Use domcontentloaded, load or networkidle.')
        }
        if (load === 'networkidle') {
            let last: number | undefined
            let since = 0
            await session.browser.waitUntil(async () => {
                const ready = await session.browser.execute(() => document.readyState)
                const count = await session.browser.execute(() => performance.getEntriesByType('resource').length) as number
                if (ready !== 'complete') {
                    return false
                }
                const now = Date.now()
                if (last !== count) {
                    last = count
                    since = now
                    return false
                }
                return now - since >= NETWORK_QUIET_MS
            }, options('The page did not become network-idle'))
            return done('Page is network-idle', 'await browser.waitUntil(async () => document.readyState === \'complete\')')
        }
        const ready = load === 'load' ? 'complete' : 'interactive'
        await session.browser.waitUntil(async () => {
            const state = await session.browser.execute(() => document.readyState) as string
            return load === 'load' ? state === 'complete' : state === 'interactive' || state === 'complete'
        }, options(`document.readyState did not reach ${ready}`))
        return done(`Page reached ${load}`, `await browser.waitUntil(async () => document.readyState === ${quote(ready === 'interactive' ? 'interactive' : 'complete')} || document.readyState === 'complete')`)
    }

    const target = String(args.target ?? '')
    if (/^\d+$/.test(target)) {
        const ms = Number(target)
        if (ms > MAX_SLEEP_MS) {
            throw usage(`Refusing to sleep for ${ms}ms.`, 'Wait for --text, --url, a selector or --fn instead of a long pause.')
        }
        await new Promise((resolve) => setTimeout(resolve, ms))
        return done(`Waited ${ms}ms`, `await browser.pause(${ms})`)
    }
    const state = String(args.state ?? 'visible')
    if (!['visible', 'hidden', 'enabled', 'disabled'].includes(state)) {
        throw usage(`Unknown state "${state}".`, 'Use visible, hidden, enabled or disabled.')
    }
    const resolved = await waiter(session, target)
    const reverse = state === 'hidden' || state === 'disabled'
    if (state === 'enabled' || state === 'disabled') {
        await resolved.element.waitForEnabled({ timeout: limit, reverse, timeoutMsg: timeoutMsg(`${resolved.label} did not become ${state}`) })
        return done(`${resolved.label} is ${state}`, `await ${resolved.code}.waitForEnabled(${reverse ? '{ reverse: true }' : ''})`)
    }
    await resolved.element.waitForDisplayed({ timeout: limit, reverse, timeoutMsg: timeoutMsg(`${resolved.label} did not become ${state}`) })
    return done(`${resolved.label} is ${state}`, `await ${resolved.code}.waitForDisplayed(${reverse ? '{ reverse: true }' : ''})`)
}
