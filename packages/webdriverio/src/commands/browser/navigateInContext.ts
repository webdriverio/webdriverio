import { validateUrl } from '../../utils/index.js'
import { getNetworkManager } from '../../session/networkManager.js'
import type { InitScript } from './addInitScript.js'

type WaitState = 'none' | 'interactive' | 'networkIdle' | 'complete'

const DEFAULT_NETWORK_IDLE_TIMEOUT = 5000
const DEFAULT_WAIT_STATE = 'complete'

export interface UrlCommandOptions {
    /**
     * The desired state the requested resource should be in before finishing the command.
     * @default 'complete'
     */
    wait?: WaitState
    /**
     * Headers to be sent with the request.
     * @default {}
     */
    headers?: Record<string, string>
    /**
     * Basic authentication credentials.
     * Note: this will overwrite the existing `Authorization` header if provided in the `headers` option.
     */
    auth?: {
        user: string
        pass: string
    }
    /**
     * How long to wait for network idle, in milliseconds.
     * Requires `wait: 'networkIdle'`.
     * @default 5000
     */
    timeout?: number
    /**
     * A function called before the page has loaded its resources.
     * It is serialized and executed in the browser context for this navigation only.
     */
    onBeforeLoad?: Function
}

/**
 * Navigate one browsing context and return the document request, when BiDi
 * reported a navigation id. `context` is the value passed to
 * `browsingContext.navigate` (a context id).
 */
export async function navigateInContext (
    browser: WebdriverIO.Browser,
    context: string,
    path: string,
    options: UrlCommandOptions = {}
): Promise<WebdriverIO.Request | undefined> {
    let resetPreloadScript: InitScript | undefined

    if (options.onBeforeLoad) {
        if (typeof options.onBeforeLoad !== 'function') {
            throw new Error(`Option "onBeforeLoad" must be a function, but received: ${typeof options.onBeforeLoad}`)
        }

        resetPreloadScript = await browser.addInitScript(options.onBeforeLoad as (() => void))
    }

    if (options.auth) {
        options.headers = {
            ...(options.headers || {}),
            Authorization: `Basic ${btoa(`${options.auth.user}:${options.auth.pass}`)}`
        }
    }

    let navigationError: unknown
    let request: WebdriverIO.Request | undefined = undefined
    try {
        let mock: WebdriverIO.Mock | undefined
        if (options.headers) {
            mock = await browser.mock(path)
            mock.requestOnce({ headers: options.headers })
        }

        /**
         * WebDriver Classic allowed a `pageLoadStrategy` capability.
         * Map it onto the WebDriver BiDi readiness state.
         */
        const classicPageLoadStrategy = browser.capabilities.pageLoadStrategy === 'none'
            ? 'none'
            : browser.capabilities.pageLoadStrategy === 'normal'
                ? 'complete'
                : browser.capabilities.pageLoadStrategy === 'eager'
                    ? 'interactive'
                    : undefined

        const wait = options.wait === 'networkIdle'
            ? 'complete'
            : options.wait || classicPageLoadStrategy || DEFAULT_WAIT_STATE
        const navigation = await browser.browsingContextNavigate({
            context,
            url: path,
            wait
        }).catch((err: Error) => {
            /**
             * WebDriver BiDi can fail a navigation that races another one.
             * @see https://github.com/w3c/webdriver-bidi/issues/878
             */
            if (
                err.message.includes('navigation canceled by concurrent navigation') ||
                err.message.includes('failed with error: unknown error') ||
                err.message.includes('no such frame')
            ) {
                return browser.navigateTo(validateUrl(path))
            }

            throw err
        })

        if (mock) {
            await mock.restore()
        }

        /**
         * Classic fallback (`navigateTo`) and some BiDi navigations (same-document)
         * do not provide a navigation id. Skip network tracking in those cases.
         */
        const navigationId = navigation?.navigation
        if (!navigationId) {
            return undefined
        }

        const network = getNetworkManager(browser)

        if (options.wait === 'networkIdle') {
            const timeout = options.timeout || DEFAULT_NETWORK_IDLE_TIMEOUT
            await browser.waitUntil(async () => {
                return network.getPendingRequests(navigationId).length === 0
            }, {
                timeout,
                timeoutMsg: () => {
                    const pendingRequests = network.getPendingRequests(navigationId)
                    return `Navigation to '${path}' timed out after ${timeout}ms with ${pendingRequests.length} (${pendingRequests.map((r) => r.url).join(', ')}) pending requests`
                }
            })
        }

        request = await browser.waitUntil(
            () => network.getRequestResponseData(navigationId),
            {
                interval: 1,
                timeoutMsg: `Navigation to '${path}' timed out as no request payload was received`
            }
        )
    } catch (err) {
        navigationError = err
    } finally {
        if (resetPreloadScript) {
            try {
                await resetPreloadScript.remove()
            } catch (cleanupError) {
                if (!navigationError) {
                    navigationError = cleanupError
                }
            }
        }
    }

    if (navigationError) {
        throw navigationError
    }

    return request
}
