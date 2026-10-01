import type { local } from 'webdriver'

import { getContextManager } from '../session/context.js'

/**
 * WebDriver's default page load timeout.
 * @see https://w3c.github.io/webdriver/#dfn-session-page-load-timeout
 */
const DEFAULT_PAGE_LOAD_TIMEOUT = 300_000

/**
 * A back-forward cache restore can reject `scriptEvaluate` at the instant
 * `navigationCommitted` arrives. Retry until the realm accepts the call.
 * A network navigation reports `loading` and still waits for the load event.
 */
const READY_STATE_RETRY_MS = 50

/**
 * `browsingContext.historyUpdated` has no navigation id. `pushState` and
 * `replaceState` emit it for the same context, so the page's Navigation API
 * records whether the last history change was a traversal.
 *
 * Each command stores its listener under its own id. A later cleanup must
 * not remove a traversal that is still waiting.
 */
const HISTORY_MARKER = '__wdioHistoryTraverse'

function historyMarkerId () {
    return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

function installHistoryMarker (id: string) {
    const key = JSON.stringify(id)
    return `(() => {
    const nav = globalThis.navigation
    if (!nav || typeof nav.addEventListener !== 'function') {
        return 'unsupported'
    }
    const events = []
    const onNavigate = (event) => {
        events.push(event.navigationType)
    }
    const root = globalThis.${HISTORY_MARKER} || (globalThis.${HISTORY_MARKER} = { entries: {} })
    root.entries[${key}] = { events, onNavigate }
    nav.addEventListener('navigate', onNavigate)
    return 'installed'
})()`
}

function readHistoryMarker (id: string) {
    const key = JSON.stringify(id)
    return `(() => {
    const root = globalThis.${HISTORY_MARKER}
    const entry = root && root.entries && root.entries[${key}]
    if (!entry || !Array.isArray(entry.events) || entry.events.length === 0) {
        return ''
    }
    return String(entry.events[entry.events.length - 1])
})()`
}

function clearHistoryMarker (id: string) {
    const key = JSON.stringify(id)
    return `(() => {
    const root = globalThis.${HISTORY_MARKER}
    const entry = root && root.entries && root.entries[${key}]
    if (!entry) {
        return
    }
    const nav = globalThis.navigation
    if (nav && typeof nav.removeEventListener === 'function') {
        nav.removeEventListener('navigate', entry.onNavigate)
    }
    delete root.entries[${key}]
})()`
}

/**
 * Events that describe a history traversal. `traverseHistory` returns before
 * the traversal finishes, so listeners are installed before the command.
 * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-traverseHistory
 */
const HISTORY_NAVIGATION_EVENTS = [
    'browsingContext.navigationStarted',
    'browsingContext.navigationCommitted',
    'browsingContext.domContentLoaded',
    'browsingContext.load',
    'browsingContext.fragmentNavigated',
    'browsingContext.historyUpdated'
] as const

type HistoryReadiness = 'none' | 'interactive' | 'complete'

type NavigationInfo = { context?: string }

/**
 * Same mapping `browser.url()` uses for `pageLoadStrategy`.
 * An unset strategy waits for the complete load, which is the WebDriver default.
 */
export function historyReadiness (strategy: WebdriverIO.Capabilities['pageLoadStrategy']): HistoryReadiness {
    if (strategy === 'none') {
        return 'none'
    }
    if (strategy === 'eager') {
        return 'interactive'
    }
    return 'complete'
}

/**
 * Top-level browsing context. History traversal rejects `invalid argument`
 * for a frame, and classic back/forward also act on the top-level traversable.
 * A `switchFrame` updates the current context and must not change this id.
 */
async function topLevelBrowsingContext (browser: WebdriverIO.Browser): Promise<string> {
    const handle = getContextManager(browser).getCurrentWindowHandle()
    if (handle) {
        return handle
    }
    return browser.getWindowHandle()
}

async function pageLoadTimeout (browser: WebdriverIO.Browser): Promise<number> {
    const fromSession = await browser.getTimeouts().then(
        (timeouts) => timeouts?.pageLoad,
        () => undefined
    )
    if (typeof fromSession === 'number' && fromSession >= 0) {
        return fromSession
    }

    const fromCapabilities = browser.capabilities.timeouts?.pageLoad
    if (typeof fromCapabilities === 'number' && fromCapabilities >= 0) {
        return fromCapabilities
    }

    return DEFAULT_PAGE_LOAD_TIMEOUT
}

function matchesContext (params: NavigationInfo | undefined, context: string) {
    return params?.context === context
}

async function evaluateString (
    browser: WebdriverIO.Browser,
    context: string,
    expression: string
): Promise<string | undefined> {
    try {
        const result = await browser.scriptEvaluate({
            expression,
            awaitPromise: false,
            target: { context }
        })
        if (result.type !== 'success') {
            return undefined
        }
        const value = result.result
        if (value && typeof value === 'object' && 'type' in value && value.type === 'string' && 'value' in value && typeof value.value === 'string') {
            return value.value
        }
        return undefined
    } catch {
        return undefined
    }
}

function delay (ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

function readyStateSatisfies (readiness: HistoryReadiness, state: string | undefined) {
    if (readiness === 'interactive') {
        return state === 'interactive' || state === 'complete'
    }
    return state === 'complete'
}

interface DocumentSnapshot {
    href: string
    readyState: string
    marked: boolean
}

/**
 * Each command marks the outgoing document under its own token. A single
 * shared slot would let a concurrent traversal overwrite the mark, and the
 * first command would then take the outgoing document for the destination.
 */
const DOCUMENT_TOKENS = '__wdioHistoryTokens'

/**
 * One script reads the URL, readiness, and document mark together. Separate
 * evaluations can observe the outgoing document and the restored one.
 * With `stamp`, the document is marked with `token` first.
 */
function documentSnapshot (token: string, stamp: boolean) {
    const key = JSON.stringify(token)
    return `(() => {
    const root = document.documentElement
    ${stamp ? `if (root) (root.${DOCUMENT_TOKENS} || (root.${DOCUMENT_TOKENS} = {}))[${key}] = true` : ''}
    const tokens = root && root.${DOCUMENT_TOKENS}
    const marked = Boolean(tokens && tokens[${key}] === true)
    return JSON.stringify({ href: location.href, readyState: document.readyState, marked })
})()`
}

function parseDocumentSnapshot (value: string | undefined): DocumentSnapshot | undefined {
    if (!value) {
        return undefined
    }
    try {
        const parsed = JSON.parse(value) as Partial<DocumentSnapshot>
        if (typeof parsed.href !== 'string' || typeof parsed.readyState !== 'string' || typeof parsed.marked !== 'boolean') {
            return undefined
        }
        return { href: parsed.href, readyState: parsed.readyState, marked: parsed.marked }
    } catch {
        return undefined
    }
}

/**
 * Traverse the joint session history of the current top-level browsing context
 * by one entry and wait for the readiness `pageLoadStrategy` asks for.
 *
 * `delta` is only `-1` (back) or `1` (forward). `no such history entry` is
 * not caught: classic WebDriver rejects the same way.
 */
export async function traverseTopLevelHistory (
    browser: WebdriverIO.Browser,
    delta: -1 | 1
): Promise<void> {
    const context = await topLevelBrowsingContext(browser)
    const readiness = historyReadiness(browser.capabilities.pageLoadStrategy)

    if (readiness === 'none') {
        await browser.browsingContextTraverseHistory({ context, delta })
        return
    }

    const timeout = await pageLoadTimeout(browser)
    const expectedEvent = readiness === 'interactive' ? 'browsingContext.domContentLoaded' : 'browsingContext.load'

    let subscription: string | undefined
    let historyMarker: 'installed' | 'unavailable' = 'unavailable'
    const markerId = historyMarkerId()
    let outgoing: DocumentSnapshot | undefined
    let armed = false
    let settled = false
    let crossDocument = false
    let waitError: Error | undefined
    let resolveReady: () => void = () => {}
    let rejectReady: (error: Error) => void = () => {}

    const ready = new Promise<void>((resolve, reject) => {
        resolveReady = () => {
            if (settled) {
                return
            }
            settled = true
            resolve()
        }
        rejectReady = (error: Error) => {
            if (settled) {
                return
            }
            settled = true
            waitError = error
            reject(error)
        }
    })
    /**
     * A timeout rejects `ready`. Swallow that rejection here and rethrow
     * `waitError` from the caller so it is never unhandled when the history
     * command itself fails first.
     */
    const readySettled = ready.then(() => undefined, () => undefined)

    const succeed = (params: NavigationInfo | undefined) => {
        if (!armed || !matchesContext(params, context)) {
            return
        }
        resolveReady()
    }

    const onNavigationStarted = (params: local.BrowsingContextNavigationInfo) => {
        if (!armed || !matchesContext(params, context)) {
            return
        }
        /**
         * Cross-document traversals emit this before `historyUpdated`.
         * A same-document traversal (fragment or `pushState`) does not.
         *
         * Firefox omits `navigationCommitted` and `load` when the entry is
         * restored from the back-forward cache. The restored document can
         * also keep the same URL, so the outgoing document is marked and the
         * wait ends when a different document is already ready.
         */
        crossDocument = true
        void watchTraversalReadyState(true)
    }
    /**
     * A back-forward cache restore can commit a document that is already
     * complete and emit no `load`. A network navigation is still `loading`
     * at commit time, so a successful read does not skip that event.
     * `requireNewDocument` waits until the marked outgoing document is gone.
     * `navigationCommitted` is already that new document.
     */
    const watchTraversalReadyState = async (requireNewDocument: boolean) => {
        try {
            while (armed && !settled) {
                const sample = parseDocumentSnapshot(await evaluateString(browser, context, documentSnapshot(markerId, false)))
                if (!armed || settled) {
                    return
                }
                /**
                 * `undefined` means the realm rejected the check. A cache
                 * restore has no later `load` event, so try again.
                 */
                if (!sample) {
                    await delay(READY_STATE_RETRY_MS)
                    continue
                }
                if (requireNewDocument && (!outgoing || sample.marked)) {
                    await delay(READY_STATE_RETRY_MS)
                    continue
                }
                if (readyStateSatisfies(readiness, sample.readyState)) {
                    resolveReady()
                }
                return
            }
        } catch {
            /**
             * The load or DOMContentLoaded event still completes the wait.
             */
        }
    }
    const onNavigationCommitted = (params: local.BrowsingContextNavigationInfo) => {
        if (!armed || !matchesContext(params, context)) {
            return
        }
        void watchTraversalReadyState(false)
    }
    const onDomContentLoaded = (params: local.BrowsingContextNavigationInfo) => {
        if (readiness === 'interactive') {
            succeed(params)
        }
    }
    const onLoad = (params: local.BrowsingContextNavigationInfo) => {
        succeed(params)
    }
    const onFragmentNavigated = (params: local.BrowsingContextNavigationInfo) => {
        /**
         * Fragment navigations finish without `load`. The document is already
         * in the requested readiness state.
         */
        succeed(params)
    }
    const onHistoryUpdated = (params: local.BrowsingContextHistoryUpdatedParameters) => {
        if (crossDocument || !armed || !matchesContext(params, context)) {
            return
        }
        /**
         * Without the Navigation API this event cannot be tied to the
         * traversal. Same-document entries still have no other completion
         * signal, so keep the previous behavior there.
         */
        if (historyMarker !== 'installed') {
            succeed(params)
            return
        }
        void evaluateString(browser, context, readHistoryMarker(markerId)).then((kind) => {
            if (!armed || settled || crossDocument || kind !== 'traverse') {
                return
            }
            resolveReady()
        })
    }

    browser.on('browsingContext.navigationStarted', onNavigationStarted)
    browser.on('browsingContext.navigationCommitted', onNavigationCommitted)
    browser.on('browsingContext.domContentLoaded', onDomContentLoaded)
    browser.on('browsingContext.load', onLoad)
    browser.on('browsingContext.fragmentNavigated', onFragmentNavigated)
    browser.on('browsingContext.historyUpdated', onHistoryUpdated)

    const timer = setTimeout(() => {
        rejectReady(new Error(
            `History traversal timed out after ${timeout}ms waiting for ${expectedEvent}`
        ))
    }, timeout)

    let commandError: unknown
    try {
        const subscribed = await browser.sessionSubscribe({
            events: [...HISTORY_NAVIGATION_EVENTS],
            contexts: [context]
        })
        subscription = subscribed.subscription
        if (await evaluateString(browser, context, installHistoryMarker(markerId)) === 'installed') {
            historyMarker = 'installed'
        }
        for (let attempt = 0; attempt < 5 && !outgoing && !settled; attempt++) {
            const stamped = parseDocumentSnapshot(await evaluateString(browser, context, documentSnapshot(markerId, true)))
            if (stamped?.marked) {
                outgoing = stamped
                break
            }
            if (attempt < 4 && !settled) {
                await delay(READY_STATE_RETRY_MS)
            }
        }
        /**
         * Arm only after the subscription exists and immediately before the
         * command. The spec returns before the traversal finishes, and the
         * navigation events can arrive before that response.
         */
        armed = true
        try {
            await browser.browsingContextTraverseHistory({ context, delta })
        } catch (err) {
            commandError = err
        }

        if (commandError) {
            throw commandError
        }
        if (waitError) {
            throw waitError
        }
        if (!settled) {
            await readySettled
        }
        if (waitError) {
            throw waitError
        }
    } finally {
        armed = false
        clearTimeout(timer)
        browser.off('browsingContext.navigationStarted', onNavigationStarted)
        browser.off('browsingContext.navigationCommitted', onNavigationCommitted)
        browser.off('browsingContext.domContentLoaded', onDomContentLoaded)
        browser.off('browsingContext.load', onLoad)
        browser.off('browsingContext.fragmentNavigated', onFragmentNavigated)
        browser.off('browsingContext.historyUpdated', onHistoryUpdated)
        if (!settled) {
            resolveReady()
        }
        if (historyMarker === 'installed') {
            void evaluateString(browser, context, clearHistoryMarker(markerId))
        }
        /**
         * Unsubscribing is cleanup. A dropped socket waits for the BiDi
         * response timeout, and the traversal result is already known.
         */
        if (subscription) {
            void browser.sessionUnsubscribe({ subscriptions: [subscription] }).catch(() => undefined)
        }
    }
}
