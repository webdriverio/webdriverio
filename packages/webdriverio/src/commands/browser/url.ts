import { validateUrl } from '../../utils/index.js'
import { networkManager } from '../../networkManager.js'

type WaitState = 'none' | 'interactive' | 'networkIdle' | 'complete'

const DEFAULT_NETWORK_IDLE_TIMEOUT = 5000
const DEFAULT_WAIT_STATE = 'complete'

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
}

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
    await expect($('p=Congratulations! You must have the proper credentials.).toBeDisplayed();
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
        const context = await this.getWindowHandle()

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

        const wait = options.wait === 'networkIdle'
            ? 'complete'
            : options.wait || DEFAULT_WAIT_STATE
        await this.browsingContextNavigate({
            context,
            url: path,
            wait
        })

        const network = networkManager.get(this)
        const request = network?.getRequestResponseData(context)

        if (mock) {
            await mock.restore()
        }

        if (network && options.wait === 'networkIdle') {
            const timeout = options.timeout || DEFAULT_NETWORK_IDLE_TIMEOUT
            await this.waitUntil(async () => {
                return network.getPendingRequests(context) === 0
            }, {
                timeout,
                timeoutMsg: `Navigation to '${path}' timed out after ${timeout}ms with ${network.getPendingRequests(context)} pending requests`
            })
        }

        return request
    }

    if (options.headers) {
        throw new Error('Setting headers is only supported when automating browser using WebDriver Bidi protocol')
    }

    await this.navigateTo(validateUrl(path))
}
