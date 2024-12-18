import { validateUrl } from '../../utils/index.js'
import { getNetworkManager } from '../../networkManager.js'
import { getContextManager } from '../../context.js'
import type { InitScript } from './addInitScript.js'

type WaitState = 'none' | 'interactive' | 'networkIdle' | 'complete'

const DEFAULT_NETWORK_IDLE_TIMEOUT = 5000
const DEFAULT_WAIT_STATE = 'complete'

/**
 *
 * The `url` command loads an URL in the browser. If a baseUrl is specified in the config,
 * it will be prepended to the url parameter using node's url.resolve() method. Calling
 * `browser.url('...')` with the same url as last time will trigger a page reload.
 *
 * The command returns an `WebdriverIO.Request` object that contains information about the
 * request and response data of the page load.
 *
 * The command supports the following options:
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
    const request = await browser.url('https://webdriver.io');
    // log url
    console.log(request.url); // outputs: "https://webdriver.io"

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
 * @param {String=} url  the URL to navigate to
 * @param {UrlOptions=} options  navigation options
 * @returns {WebdriverIO.Request} a request object of the page load with information about the request and response data
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

    if (this.isBidi) {
        let resetPreloadScript: InitScript | undefined
        const contextManager = getContextManager(this)
        const context = await contextManager.getCurrentContext()

        /**
         * set up preload script if `onBeforeLoad` option is provided
         */
        if (options.onBeforeLoad) {
            if (typeof options.onBeforeLoad !== 'function') {
                throw new Error(`Option "onBeforeLoad" must be a function, but received: ${typeof options.onBeforeLoad}`)
            }

            resetPreloadScript = await this.addInitScript(options.onBeforeLoad)
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
            context,
            url: path,
            wait
        })

        if (mock) {
            await mock.restore()
        }

        const network = getNetworkManager(this)

        if (options.wait === 'networkIdle') {
            const timeout = options.timeout || DEFAULT_NETWORK_IDLE_TIMEOUT
            await this.waitUntil(async () => {
                return network.getPendingRequests(context).length === 0
            }, {
                timeout,
                timeoutMsg: `Navigation to '${path}' timed out after ${timeout}ms with ${network.getPendingRequests(context).length} (${network.getPendingRequests(context).map((r) => r.url).join(', ')}) pending requests`
            })
        }

        /**
         * clear up preload script
         */
        if (resetPreloadScript) {
            await resetPreloadScript.remove()
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
            }
        )
        return request
    }

    if (Object.keys(options).length > 0) {
        throw new Error('Setting url options is only supported when automating browser using WebDriver Bidi protocol')
    }

    await this.navigateTo(validateUrl(path))
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
