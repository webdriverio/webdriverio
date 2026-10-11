/**
 * WebDriver BiDi has no script timeout (https://github.com/w3c/webdriver-bidi/issues/199),
 * so `execute` gives the session's `script` timeout to the BiDi command
 * (`BIDI_SCRIPT_TIMEOUT` of the `webdriver` package), as a WebDriver Classic
 * driver applies it to `executeScript`.
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
 * capabilities. Without one there (an attached session has the capabilities the
 * user passed), it reads the timeouts of the session once, else it uses the
 * default of the WebDriver spec.
 */
export async function scriptTimeoutOf (browser: WebdriverIO.Browser): Promise<number | null> {
    const set = scriptTimeouts.get(browser)
    if (set && set.sessionId === browser.sessionId) {
        return set.script
    }
    const fromCapabilities = (browser.capabilities as WebdriverIO.Capabilities | undefined)?.timeouts?.script
    if (fromCapabilities === null || typeof fromCapabilities === 'number') {
        return fromCapabilities
    }

    const sessionId = browser.sessionId
    const fromSession = typeof browser.getTimeouts === 'function'
        ? await browser.getTimeouts().then(({ script }) => script, () => undefined)
        : undefined
    const script = fromSession === null || typeof fromSession === 'number' ? fromSession : DEFAULT_SCRIPT_TIMEOUT
    /**
     * keep a value that `setTimeouts` stored while the request ran
     */
    if (!scriptTimeouts.has(browser) || scriptTimeouts.get(browser)!.sessionId !== sessionId) {
        scriptTimeouts.set(browser, { sessionId, script })
    }
    return script
}

/**
 * The `script` timeout to give a BiDi command, or `undefined` for no limit
 * (`null`, or more than a timer can hold).
 */
export async function bidiScriptTimeoutOf (browser: WebdriverIO.Browser): Promise<number | undefined> {
    const timeout = await scriptTimeoutOf(browser)
    return timeout === null || timeout > MAX_TIMER_DELAY ? undefined : timeout
}
