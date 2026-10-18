/**
 * WebDriver BiDi has no script timeout (https://github.com/w3c/webdriver-bidi/issues/199),
 * so `execute` gives the session's `script` timeout to the BiDi command
 * (`BIDI_SCRIPT_TIMEOUT` of the `webdriver` package), as a WebDriver Classic
 * driver applies it to `executeScript`.
 */

import type { Capabilities } from '@wdio/types'

/**
 * the default `script` timeout of the WebDriver spec
 */
const DEFAULT_SCRIPT_TIMEOUT = 30_000
/**
 * the longest delay of a browser timer: a longer one fires at once
 */
const MAX_TIMER_DELAY = 2_147_483_647

interface CommandResultEvent {
    command: string
    body: unknown
    result: unknown
}

/**
 * the `script` timeout of the session, set with `browser.setTimeout()`
 */
const scriptTimeouts = new WeakMap<WebdriverIO.Browser, { sessionId: string, script: number | null }>()
const trackedBrowsers = new WeakSet<WebdriverIO.Browser>()
/**
 * sessions that `attach()` joined: their capabilities come from the user, not
 * from the driver, so their `timeouts` may be out of date
 */
const attachedBrowsers = new WeakSet<WebdriverIO.Browser>()

/**
 * Read the `script` timeout from the session instead of its capabilities.
 */
export function markAttachedSession (browser: WebdriverIO.Browser) {
    attachedBrowsers.add(browser)
}

/**
 * Follow the `script` timeout that `setTimeouts` sets for the session.
 */
export function trackScriptTimeout (browser: WebdriverIO.Browser) {
    if (trackedBrowsers.has(browser)) {
        return
    }
    trackedBrowsers.add(browser)
    browser.on('result', ({ command, body, result }: CommandResultEvent) => {
        if (command !== 'setTimeouts' || !body || typeof body !== 'object' || !('script' in body) || body.script === undefined) {
            return
        }
        if (result && typeof result === 'object' && 'error' in result && result.error) {
            return
        }
        scriptTimeouts.set(browser, {
            sessionId: browser.sessionId,
            script: typeof body.script === 'number' ? body.script : null
        })
    })
}

/**
 * The `script` timeout of the session in milliseconds, or `null` for no limit:
 * the last value set with `browser.setTimeout()`, else the one in the
 * capabilities that the driver returned for a new session. For an attached
 * session (its capabilities come from the user) or without a value there, it
 * reads the timeouts of the session once, else it uses the default of the
 * WebDriver spec.
 */
export async function scriptTimeoutOf (browser: WebdriverIO.Browser): Promise<number | null> {
    const set = scriptTimeouts.get(browser)
    if (set && set.sessionId === browser.sessionId) {
        return set.script
    }
    const fromCapabilities = attachedBrowsers.has(browser)
        ? undefined
        : (browser.capabilities as WebdriverIO.Capabilities | undefined)?.timeouts?.script
    if (fromCapabilities === null || typeof fromCapabilities === 'number') {
        return fromCapabilities
    }

    const sessionId = browser.sessionId
    const fromSession = typeof browser.getTimeouts === 'function'
        ? await browser.getTimeouts().then(({ script }) => script, () => undefined)
        : undefined
    const script = fromSession === null || typeof fromSession === 'number' ? fromSession : DEFAULT_SCRIPT_TIMEOUT
    /**
     * a successful `setTimeouts` while the request ran is newer than its answer
     */
    const current = scriptTimeouts.get(browser)
    if (current && current.sessionId === sessionId) {
        return current.script
    }
    scriptTimeouts.set(browser, { sessionId, script })
    return script
}

/**
 * sessions that got their `script` timeout from `setAppiumScriptTimeout`
 */
const appiumScriptTimeouts = new WeakMap<WebdriverIO.Browser, string>()

/**
 * The Appium XCUITest driver (iOS) gives Execute Async Script 0 ms when the client
 * set no `script` timeout (the WebDriver default is 30 s), and it ignores
 * `timeouts.script` in the capabilities. Set the timeout of the capabilities, else
 * the default, once per session, unless `browser.setTimeout()` set one.
 *
 * TODO: remove when the supported XCUITest drivers start with the W3C default
 * (appium/appium-xcuitest-driver#3056, #3041) and apply the capability (appium/appium#23014).
 */
export async function setAppiumScriptTimeout (browser: WebdriverIO.Browser) {
    if (!browser.isMobile || !browser.isIOS) {
        return
    }
    const sessionId = browser.sessionId
    const set = scriptTimeouts.get(browser)
    if ((set && set.sessionId === sessionId) || appiumScriptTimeouts.get(browser) === sessionId) {
        return
    }
    appiumScriptTimeouts.set(browser, sessionId)
    const requested = browser.requestedCapabilities as Capabilities.W3CCapabilities | WebdriverIO.Capabilities | undefined
    const script = (requested && 'alwaysMatch' in requested ? requested.alwaysMatch : requested as WebdriverIO.Capabilities | undefined)?.timeouts?.script
    // a failed request keeps the driver's own limit, as before
    await browser.setTimeout({ script: script === null ? MAX_TIMER_DELAY : script ?? DEFAULT_SCRIPT_TIMEOUT }).catch(() => undefined)
}
