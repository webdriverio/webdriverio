/**
 * WebDriver BiDi has no script timeout (https://github.com/w3c/webdriver-bidi/issues/199),
 * so `execute` applies the session's `script` timeout itself, as a WebDriver Classic
 * driver does for `executeScript`.
 */

/**
 * the default `script` timeout of the WebDriver spec
 */
const DEFAULT_SCRIPT_TIMEOUT = 30_000
/**
 * `setTimeout` fires at once for a longer delay, so a longer timeout means no limit
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
 * the last value set with `browser.setTimeout()`, else the one in the session
 * capabilities, else the default of the WebDriver spec.
 */
export function scriptTimeoutOf (browser: WebdriverIO.Browser): number | null {
    const set = scriptTimeouts.get(browser)
    if (set && set.sessionId === browser.sessionId) {
        return set.script
    }
    const fromCapabilities = (browser.capabilities as WebdriverIO.Capabilities | undefined)?.timeouts?.script
    if (fromCapabilities === null) {
        return null
    }
    return typeof fromCapabilities === 'number' ? fromCapabilities : DEFAULT_SCRIPT_TIMEOUT
}

/**
 * Reject with a `script timeout` error when `call` does not settle within the
 * `script` timeout of the session. The script keeps running in the page, as with
 * WebDriver Classic, and its late result is ignored.
 */
export async function withScriptTimeout<T> (browser: WebdriverIO.Browser, call: Promise<T>): Promise<T> {
    const timeout = scriptTimeoutOf(browser)
    if (timeout === null || timeout > MAX_TIMER_DELAY) {
        return call
    }

    /**
     * a result or error that arrives after the timeout must not be an unhandled rejection
     */
    call.catch(() => {})
    let timer: ReturnType<typeof setTimeout> | undefined
    const expired = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            const error = new Error(
                `script timeout: the script did not finish within ${timeout}ms. ` +
                'Set a longer "script" timeout with `browser.setTimeout({ script })` if it needs more time.'
            )
            error.name = 'script timeout'
            reject(error)
        }, timeout)
    })
    try {
        return await Promise.race([call, expired])
    } finally {
        clearTimeout(timer)
    }
}
