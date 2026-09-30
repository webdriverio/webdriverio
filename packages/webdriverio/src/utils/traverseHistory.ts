import type { local } from 'webdriver'

import { getContextManager } from '../session/context.js'

/**
 * WebDriver's default page load timeout.
 * @see https://w3c.github.io/webdriver/#dfn-session-page-load-timeout
 */
const DEFAULT_PAGE_LOAD_TIMEOUT = 300_000

/**
 * Events that describe a history traversal. `traverseHistory` returns before
 * the traversal finishes, so listeners are installed before the command.
 * @see https://w3c.github.io/webdriver-bidi/#command-browsingContext-traverseHistory
 */
const HISTORY_NAVIGATION_EVENTS = [
    'browsingContext.navigationStarted',
    'browsingContext.domContentLoaded',
    'browsingContext.load',
    'browsingContext.fragmentNavigated',
    'browsingContext.historyUpdated',
    'browsingContext.navigationFailed',
    'browsingContext.navigationAborted'
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
     * A timeout or navigation failure rejects `ready`. Swallow that rejection
     * here and rethrow `waitError` from the caller so it is never unhandled
     * when the history command itself fails first.
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
         */
        crossDocument = true
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
        if (crossDocument) {
            return
        }
        succeed(params)
    }
    const onNavigationFailed = (params: local.BrowsingContextNavigationInfo) => {
        if (!armed || !matchesContext(params, context)) {
            return
        }
        rejectReady(new Error('History traversal failed before the page finished loading'))
    }

    browser.on('browsingContext.navigationStarted', onNavigationStarted)
    browser.on('browsingContext.domContentLoaded', onDomContentLoaded)
    browser.on('browsingContext.load', onLoad)
    browser.on('browsingContext.fragmentNavigated', onFragmentNavigated)
    browser.on('browsingContext.historyUpdated', onHistoryUpdated)
    browser.on('browsingContext.navigationFailed', onNavigationFailed)
    browser.on('browsingContext.navigationAborted', onNavigationFailed)

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
        browser.off('browsingContext.domContentLoaded', onDomContentLoaded)
        browser.off('browsingContext.load', onLoad)
        browser.off('browsingContext.fragmentNavigated', onFragmentNavigated)
        browser.off('browsingContext.historyUpdated', onHistoryUpdated)
        browser.off('browsingContext.navigationFailed', onNavigationFailed)
        browser.off('browsingContext.navigationAborted', onNavigationFailed)
        if (!settled) {
            resolveReady()
        }
        if (subscription) {
            await browser.sessionUnsubscribe({ subscriptions: [subscription] }).catch(() => {})
        }
    }
}
