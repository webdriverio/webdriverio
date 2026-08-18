import { validateUrl } from '../../utils/index.js'
import { getNetworkManager } from '../../session/networkManager.js'
import { getContextManager } from '../../session/context.js'
import { SESSION_MOCKS } from './mock.js'
import type { InitScript } from './addInitScript.js'

type WaitState = 'none' | 'interactive' | 'networkIdle' | 'complete'

const DEFAULT_NETWORK_IDLE_TIMEOUT = 5000
const DEFAULT_WAIT_STATE = 'complete'

/**
 *
 * The `url` command loads an URL in the browser. If a baseUrl is specified in the config,
 * it will be prepended to the url parameter using node's url.resolve() method. Calling
 * `browser.url('...')` with the same url as last time will trigger a page reload. However,
 * if the url contains a hash, the browser will not trigger a new navigation and the user
 * has to [refresh](/docs/api/webdriver#refresh) the page to trigger one.
 *
 * The command returns an `WebdriverIO.Request` object that contains information about the
 * request and response data of the page load:
 *
 * ```ts
 * interface WebdriverIO.Request {
 *   id?: string
 *   url: string
 *   timestamp: number
 *   navigation?: string
 *   redirectChain?: string[],
 *   headers: Record<string, string>
 *   cookies?: NetworkCookie[]
 *   \/**
 *    * Error message if request failed
 *    *\/
 *   error?: string
 *   response?: {
 *       fromCache: boolean
 *       headers: Record<string, string>
 *       mimeType: string
 *       status: number
 *   },
 *   /**
 *    * List of all requests that were made due to the main request.
 *    * Note: the list may be incomplete and does not contain request that were
 *    * made after the command has finished.
 *    *
 *    * The property will be undefined if the request is not a document request
 *    * that was initiated by the browser.
 *    *\/
 *   children?: Request[]
 * }
 * ```
 *
 * :::info macOS performance
 *
 * On **macOS**, Chrome's BiDi `browsingContext.navigate` is significantly slower than
 * classic `navigateTo` for a simple page load (see
 * [webdriverio#15481](https://github.com/webdriverio/webdriverio/issues/15481)).
 * Therefore a plain `browser.url(url)` (no BiDi-only options) uses classic navigation
 * when the session reports a macOS browser (W3C `capabilities.platformName`, including
 * `mac` / `macOS` / `darwin` / `OS X`) and returns
 * `undefined` instead of a `Request` object. Pass a BiDi-only option (`headers`, `auth`,
 * `onBeforeLoad`, or `wait` other than `'complete'`) if you need request/response
 * metadata on macOS. On Linux and Windows the BiDi path (and `Request` return value)
 * remains the default for `browser.url(url)`.
 *
 * :::
 *
 * The command supports the following options:
 *
 * :::note
 *
 * These features unfortunately won't be available to you if your remote environment doesn't support WebDriver Bidi. You can check if Bidi is support in your session by looking into the `browser.isBidi` property.
 *
 * :::
 *
 * ### wait
 * The desired state the requested resource should be in before finishing the command.
 * It supports the following states:
 *
 *  - `none`: no wait after the page request is made and the response is received
 *  - `interactive`: wait until the page is interactive
 *  - `complete`: wait until the DOM tree of the page is fully loaded
 *  - `networkIdle`: wait until there are no pending network requests
 *
 * ### headers
 *
 * Headers to be sent with the request.
 *
 * __Default:__ `{}`
 *
 * ### auth
 *
 * Basic authentication credentials.
 * Note: this will overwrite the existing `Authorization` header if provided in the `headers` option.
 *
 * ### timeout
 *
 * If set to a number, the command will wait for the specified amount of milliseconds for the page to load
 * all responses before returning.
 *
 * Note: for this to have an impact, it requires the `wait` option to be set to `networkIdle`.
 *
 * __Default:__ `5000`
 *
 * <example>
    :url.js
    // navigate to a new URL
    // On Linux/Windows (BiDi): returns Request with response metadata
    // On macOS browsers: uses classic navigateTo for speed; returns undefined
    const request = await browser.url('https://webdriver.io')
    console.log(request?.url) // "https://webdriver.io" (undefined on macOS without BiDi options)
    console.log(request?.response?.status) // e.g. 200 (undefined on macOS without BiDi options)

    :urlRequestMacOS.js
    // On a macOS browser session, pass a BiDi-only option to get Request metadata
    const request = await browser.url('https://webdriver.io', { wait: 'networkIdle' })
    console.log(request.url)
    console.log(request.response?.status)
    console.log(request.response?.headers)

    :baseUrlResolutions.js
    // With a base URL of http://example.com/site, the following url parameters resolve as such:
    // When providing a scheme:
    // https://webdriver.io
    await browser.url('https://webdriver.io');

    // When not starting with a slash, the URL resolves relative to the baseUrl
    // http://example.com/site/relative
    await browser.url('relative');

    // When starting with a slash, the URL resolves relative to the root path of the baseUrl
    // http://example.com/rootRelative
    await browser.url('/rootRelative');

    :basicAuth.js
    // navigate to a URL with basic authentication
    await browser.url('https://the-internet.herokuapp.com/basic_auth', {
        auth: {
            user
            pass
        }
    });
    await expect($('p=Congratulations! You must have the proper credentials.').toBeDisplayed();

    :onBeforeLoad.js
    // navigate to a URL and mock the battery API
    await browser.url('https://pazguille.github.io/demo-battery-api/', {
        onBeforeLoad (win) {
            // mock "navigator.battery" property
            // returning mock charge object
            win.navigator.getBattery = () => Promise.resolve({
                level: 0.5,
                charging: false,
                chargingTime: Infinity,
                dischargingTime: 3600, // seconds
            })
        }
    })
    // now we can assert actual text - we are charged at 50%
    await expect($('.battery-percentage')).toHaveText('50%')
    // and has enough juice for 1 hour
    await expect($('.battery-remaining')).toHaveText('01:00)
 * </example>
 *
 * @param {string=} url  the URL to navigate to
 * @param {UrlOptions=} options  navigation options
 * @param {'none'|'interactive'|'networkIdle'|'complete'} [options.wait]  The desired state the requested resource should be in before finishing the command. Default: 'complete'
 * @param {number=} options.timeout  If set to a number, the command will wait for the specified amount of milliseconds for the page to load
 * all responses before returning. Default: 5000
 * @param {Function=} options.onBeforeLoad  A function that is being called before your page has loaded all of its resources. It allows you to easily
 * mock the environment, e.g. overwrite Web APIs that your application uses.
 * @param {`{user: string, pass: string}`=} options.auth  basic authentication credentials
 * @param {`Record<string, string>`=} options.headers  headers to be sent with the request
 * @returns {WebdriverIO.Request|void} request/response data for the page load when the BiDi path is used; `undefined` on classic navigation (including the macOS-browser fast path for plain `url()`)
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get
 * @see  https://nodejs.org/api/url.html#url_url_resolve_from_to
 * @type protocol
 *
 */
export async function url (
    this: WebdriverIO.Browser,
    path: string,
    options: UrlCommandOptions = {}
): Promise<WebdriverIO.Request | void> {
    if (typeof path !== 'string') {
        throw new Error('Parameter for "url" command needs to be type of string')
    }

    if (typeof this.options.baseUrl === 'string' && this.options.baseUrl) {
        path = (new URL(path, this.options.baseUrl)).href
    }

    const { useBidi, context } = await planNavigation(this, path, options)

    if (useBidi) {
        let resetPreloadScript: InitScript | undefined
        const bidiContext = context as string
        /**
         * set up preload script if `onBeforeLoad` option is provided
         */
        if (options.onBeforeLoad) {
            if (typeof options.onBeforeLoad !== 'function') {
                throw new Error(`Option "onBeforeLoad" must be a function, but received: ${typeof options.onBeforeLoad}`)
            }

            resetPreloadScript = await this.addInitScript(options.onBeforeLoad as (() => void))
        }

        if (options.auth) {
            options.headers = {
                ...(options.headers || {}),
                Authorization: `Basic ${btoa(`${options.auth.user}:${options.auth.pass}`)}`
            }
        }

        let mock: WebdriverIO.Mock | undefined
        if (options.headers) {
            mock = await this.mock(path)
            mock.requestOnce({ headers: options.headers })
        }

        /**
         * WebDriver Classic allowed to provide a `pageLoadStrategy` capability.
         * To ensure backwards combatibility, we need to map the `pageLoadStrategy`
         * to the WebDriver Bidi spec.
         *
         * see https://www.w3.org/TR/webdriver2/#navigation
         */
        const classicPageLoadStrategy = this.capabilities.pageLoadStrategy === 'none'
            ? 'none'
            : this.capabilities.pageLoadStrategy === 'normal'
                ? 'complete'
                : this.capabilities.pageLoadStrategy === 'eager'
                    ? 'interactive'
                    : undefined

        const wait = options.wait === 'networkIdle'
            ? 'complete'
            : options.wait || classicPageLoadStrategy || DEFAULT_WAIT_STATE
        const navigation = await this.browsingContextNavigate({
            context: bidiContext,
            url: path,
            wait
        }).catch((err) => {
            /**
             * It seems that WebDriver Bidi runs into issue with concurrent navigation.
             * @see https://github.com/w3c/webdriver-bidi/issues/878
             */
            if (
                // Chrome error message
                err.message.includes('navigation canceled by concurrent navigation') ||
                // Firefox error message
                err.message.includes('failed with error: unknown error') ||
                // Race condition where the context is destroyed before navigation
                err.message.includes('no such frame')
            ) {
                return this.navigateTo(validateUrl(path))
            }

            throw err
        })

        if (mock) {
            await mock.restore()
        }

        const network = getNetworkManager(this)

        if (options.wait === 'networkIdle') {
            const timeout = options.timeout || DEFAULT_NETWORK_IDLE_TIMEOUT
            await this.waitUntil(async () => {
                return network.getPendingRequests(bidiContext).length === 0
            }, {
                timeout,
                timeoutMsg: `Navigation to '${path}' timed out after ${timeout}ms with ${network.getPendingRequests(bidiContext).length} (${network.getPendingRequests(bidiContext).map((r) => r.url).join(', ')}) pending requests`
            })
        }

        /**
         * clear up preload script
         */
        if (resetPreloadScript) {
            await resetPreloadScript.remove()
        }

        if (!navigation) {
            return
        }

        /**
         * wait until we have a request object
         */
        const request = await this.waitUntil(
            () => network.getRequestResponseData(navigation.navigation as string),
            /**
             * set a short interval to immediately return once the first request payload comes in
             */
            {
                interval: 1,
                timeoutMsg: `Navigation to '${path}' timed out as no request payload was received`
            }
        )
        return request
    }

    if (Object.keys(options).length > 0 && !this.isBidi) {
        throw new Error('Setting url options is only supported when automating browser using WebDriver Bidi protocol')
    }

    await this.navigateTo(validateUrl(path))
}

interface NavigationPlan {
    /**
     * whether to navigate via BiDi `browsingContext.navigate` (`true`) or
     * classic `navigateTo` (`false`)
     */
    useBidi: boolean
    /**
     * the session's current browsing context, resolved whenever `isBidi` is
     * true regardless of `useBidi`
     */
    context?: string
}

/**
 * Decide how to navigate, and resolve the browsing context needed either way.
 *
 * ### Context resolution
 *
 * Added context resolution here, skipping this would leave them blind to the next
 * context transition (e.g. a `newWindow()` call right after).
 *
 * ### Mocks
 *
 * Added hasActiveMocks here, when mocks are active, we need to use BiDi and need to accept
 * the latency on Mac. Paused requests are only released as part of the
 * BiDi navigation flow; classic `navigateTo` blocks until the full page load
 * completes, so a request stuck waiting on a mock would hang the whole call.
 */
async function planNavigation (
    browser: WebdriverIO.Browser,
    path: string,
    options: UrlCommandOptions
): Promise<NavigationPlan> {
    const context = browser.isBidi
        ? await getContextManager(browser).getCurrentContext()
        : undefined

    const useBidi = (
        browser.isBidi &&
        path.startsWith('http') &&
        (requiresBidiNavigation(options) || hasActiveMocks() || !isMacOSPlatform(browser.capabilities.platformName))
    )

    return { useBidi, context }
}

/**
 * Keys that classic `navigateTo` can honor (or ignore as a no-op).
 */
const CLASSIC_SAFE_OPTION_KEYS = new Set(['wait', 'timeout'])

/**
 * Whether navigation needs BiDi `browsingContext.navigate`. Fail-safe for new
 * options: only an empty options object (or classic-safe `wait: 'complete'` /
 * unused `timeout`) stays on classic; everything else, including unknown
 * keys, uses BiDi so we never silently drop features.
 */
export function requiresBidiNavigation (options: UrlCommandOptions = {}): boolean {
    for (const [key, value] of Object.entries(options)) {
        if (value === undefined) {
            continue
        }

        if (!CLASSIC_SAFE_OPTION_KEYS.has(key)) {
            return true
        }

        if (key === 'wait' && value !== 'complete') {
            return true
        }
    }

    return false
}

/**
 * macOS Chrome pays a large BiDi `browsingContext.navigate` cost vs classic
 * `navigateTo` for simple loads (webdriverio#15481). Session `platformName` is
 * already the W3C value (`mac`, `macOS`, `darwin`, `OS X`, …).
 */
function isMacOSPlatform (platformName?: string) {
    return Boolean(platformName && /mac|darwin|os x/i.test(platformName))
}

/**
 * Whether any browsing context in this session currently has an active
 * `browser.mock()` interception.
 */
function hasActiveMocks (): boolean {
    return Object.values(SESSION_MOCKS).some((mocks) => mocks.size > 0)
}

interface UrlCommandOptions {
    /**
     * The desired state the requested resource should be in before finishing the command.
     * It supports the following states:
     *
     *  - `none`: no wait after the page request is made and the response is received
     *  - `interactive`: wait until the page is interactive
     *  - `complete`: wait until the DOM tree of the page is fully loaded
     *  - `networkIdle`: wait until there are no pending network requests
     *
     * @default 'complete'
     */
    wait?: WaitState
    /**
     * Headers to be sent with the request.
     * @default {}
     */
    headers?: Record<string, string>
    /**
     * Basic authentication credentials
     * Note: this will overwrite the existing `Authorization` header if provided in the `headers` option
     */
    auth?: {
        user: string
        pass: string
    }
    /**
     * If set to a number, the command will wait for the specified amount of milliseconds for the page to load
     * all responses before returning.
     *
     * Note: for this to have an impact, it requires the `wait` option to be set to `networkIdle`
     *
     * @default 5000
     */
    timeout?: number
    /**
     * A function that is being called before your page has loaded all of its resources. It allows you to easily
     * mock the environment, e.g. overwrite Web APIs that your application uses.
     *
     * Note: the provided function is being serialized and executed in the browser context. You can not pass in variables
     * from the Node.js context. Furthermore changes to the environment only apply for this specific page load.
     * Checkout `browser.addPreloadScript` for a more versatile way to mock the environment.
     */
    onBeforeLoad?: () => unknown
}
