/**
 * Members of `WebdriverIO.BrowsingContext` that need WebDriver BiDi, with
 * what to use in a WebDriver Classic session instead.
 */
const BIDI_ONLY_COMMANDS: Record<string, string> = {
    frame: 'Use `browser.switchFrame()` to run commands in a frame.',
    navigate: 'Use `browser.url()` to navigate.',
    activate: 'Use `browser.switchWindow()` to bring a window to the front.'
}

/**
 * What `browser.url()` returns in a WebDriver Classic session, e.g. with
 * Appium or Safari. There are no held browsing contexts, only the session's
 * current one, so this is the browser: `$`, `execute`, `getTitle` and every
 * other shared command run on it. `url`, `isFrame`, `parent` and `browser`
 * describe that current context. Like on a BiDi context, `url` is the URL
 * it was navigated to, until `getUrl()` reads the current one. The BiDi-only commands reject with an
 * error that names the Classic alternative, instead of being undefined.
 */
export function classicContext (browser: WebdriverIO.Browser, url: string): WebdriverIO.BrowsingContext {
    let currentUrl = url
    return new Proxy(browser, {
        get (target, prop) {
            if (prop === 'url') {
                return currentUrl
            }
            if (prop === 'getUrl') {
                return async () => {
                    currentUrl = await target.getUrl()
                    return currentUrl
                }
            }
            if (prop === 'isFrame') {
                return false
            }
            if (prop === 'parent' || prop === 'request' || prop === 'contextId') {
                return undefined
            }
            if (prop === 'browser') {
                return target
            }
            if (typeof prop === 'string' && prop in BIDI_ONLY_COMMANDS) {
                return () => Promise.reject(new Error(
                    `\`${prop}()\` needs a WebDriver BiDi session, but this session uses WebDriver Classic ` +
                    `(for example Appium or Safari), where \`browser.url()\` returns the browser itself. ${BIDI_ONLY_COMMANDS[prop]}`
                ))
            }
            const value = Reflect.get(target, prop)
            /**
             * Session state is keyed by the browser object, so commands
             * have to run on it, not on this proxy.
             */
            return typeof value === 'function' ? value.bind(target) : value
        }
    }) as unknown as WebdriverIO.BrowsingContext
}
