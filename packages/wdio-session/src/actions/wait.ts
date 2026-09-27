import { SessionError, usage } from '../errors.js'
import { quote } from '../quote.js'
import { refId } from '../snapshot/refs.js'
import { resolveTarget } from '../snapshot/target.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

const DEFAULT_LIMIT = 10_000
const MAX_SLEEP_MS = 30_000
const NETWORK_QUIET_MS = 500
const URL_META = new Set(['.', '+', '?', '^', '$', '(', ')', '|', '[', ']', '\\', '{', '}'])

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

interface PageNetwork {
    ready: string
    completed: number
    inflight: number
}

/**
 * Count requests the page started after this probe was installed, plus
 * resource-timing entries that have not finished. Completed entries alone
 * stay flat while a slow fetch is still in flight.
 */
export function pageNetworkState (): PageNetwork {
    const page = window as Window & { __wdioNet?: { inflight: number } }
    if (!page.__wdioNet) {
        const state = { inflight: 0 }
        page.__wdioNet = state
        const origFetch = window.fetch.bind(window)
        window.fetch = ((...args: Parameters<typeof fetch>) => {
            state.inflight++
            return Promise.resolve(origFetch(...args)).finally(() => {
                state.inflight--
            })
        }) as typeof fetch
        const origSend = XMLHttpRequest.prototype.send
        XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
            state.inflight++
            let settled = false
            const finish = () => {
                if (settled) {
                    return
                }
                settled = true
                state.inflight--
            }
            this.addEventListener('loadend', finish)
            try {
                return origSend.call(this, body)
            } catch (err) {
                // send() can throw before any loadend event, which would leave the count stuck.
                finish()
                throw err
            }
        }
    }
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    // A finished cross-origin resource without Timing-Allow-Origin can keep
    // responseEnd at 0. duration is still the time it took, so only an entry
    // with neither timestamp is still open.
    const unfinished = resources.filter((entry) => entry.responseEnd === 0 && entry.duration === 0).length
    return {
        ready: document.readyState,
        completed: resources.length,
        inflight: page.__wdioNet.inflight + unfinished
    }
}

/**
 * Install the probe on the current document and on later documents, so a
 * fetch that starts before `wait --load networkidle` is still counted.
 */
export async function installNetworkProbe (session: Session) {
    if (!session.isWeb || session.applies.includes('M')) {
        return
    }
    if (session.isBidi && typeof session.browser.addInitScript === 'function') {
        // The probe returns the current counts for `browser.execute`. An init
        // script ignores that return value, and the same function has to be
        // passed through so its body is what gets installed in the page.
        await session.browser.addInitScript(pageNetworkState as unknown as () => void).catch(() => {})
    }
    await session.browser.execute(pageNetworkState).catch(() => {})
}

function networkIdleCode () {
    return `await browser.waitUntil(async () => {
    const state = await browser.execute(${pageNetworkState.toString()})
    return state.ready === 'complete' && state.inflight === 0
})`
}

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
    const element = await session.browser.$(target).getElement()
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
            let last = ''
            let since = 0
            await session.browser.waitUntil(async () => {
                const state = await session.browser.execute(pageNetworkState) as PageNetwork
                const bidi = session.get?.<Set<string>>('networkInflight')?.size ?? 0
                const now = Date.now()
                if (state.ready !== 'complete' || state.inflight > 0 || bidi > 0) {
                    last = ''
                    since = now
                    return false
                }
                const signature = String(state.completed)
                if (signature !== last) {
                    last = signature
                    since = now
                    return false
                }
                return now - since >= NETWORK_QUIET_MS
            }, options('The page did not become network-idle'))
            return done('Page is network-idle', networkIdleCode())
        }
        const ready = load === 'load' ? 'complete' : 'interactive'
        const check = load === 'load'
            ? 'document.readyState === \'complete\''
            : 'document.readyState === \'interactive\' || document.readyState === \'complete\''
        await session.browser.waitUntil(async () => {
            const state = await session.browser.execute(() => document.readyState) as string
            return load === 'load' ? state === 'complete' : state === 'interactive' || state === 'complete'
        }, options(`document.readyState did not reach ${ready}`))
        return done(`Page reached ${load}`, `await browser.waitUntil(async () => await browser.execute(() => ${check}))`)
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
    let resolved: Awaited<ReturnType<typeof waiter>>
    try {
        resolved = await waiter(session, target)
    } catch (err) {
        if (state === 'hidden' && err instanceof SessionError && (err.code === 'REF_STALE' || err.code === 'REF_NOT_FOUND' || err.code === 'ELEMENT_NOT_FOUND')) {
            const id = refId(target) || target
            return done(`${id} is hidden`, `// ${id} is already gone`)
        }
        throw err
    }
    const reverse = state === 'hidden' || state === 'disabled'
    if (state === 'enabled' || state === 'disabled') {
        await resolved.element.waitForEnabled({ timeout: limit, reverse, timeoutMsg: timeoutMsg(`${resolved.label} did not become ${state}`) })
        return done(`${resolved.label} is ${state}`, `await ${resolved.code}.waitForEnabled(${reverse ? '{ reverse: true }' : ''})`)
    }
    await resolved.element.waitForDisplayed({ timeout: limit, reverse, timeoutMsg: timeoutMsg(`${resolved.label} did not become ${state}`) })
    return done(`${resolved.label} is ${state}`, `await ${resolved.code}.waitForDisplayed(${reverse ? '{ reverse: true }' : ''})`)
}
