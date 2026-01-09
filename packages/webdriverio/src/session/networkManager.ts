import { type local } from 'webdriver'
import { SessionManager } from './session.js'

export function getNetworkManager(browser: WebdriverIO.Browser) {
    return SessionManager.getSessionManager(browser, NetworkManager)
}

type Context = string
const UNKNOWN_NAVIGATION_ID = 'UNKNOWN_NAVIGATION_ID'
const SUPPORTED_NAVIGATION_PROTOCOLS = ['http', 'https', 'data', 'file']

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class NetworkManager extends SessionManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #requests = new Map<Context, WebdriverIO.Request>()
    #lastNetworkId?: string

    #navigationStartedListener = this.#navigationStarted.bind(this)
    #responseCompletedListener = this.#responseCompleted.bind(this)
    #beforeRequestSentListener = this.#beforeRequestSent.bind(this)
    #fetchErrorListener = this.#fetchError.bind(this)

    constructor(browser: WebdriverIO.Browser) {
        super(browser, NetworkManager.name)
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!this.isEnabled()) {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * listen on required bidi events
         */
        this.#initialize = this.#browser.sessionSubscribe({
            events: [
                'browsingContext.navigationStarted',
                'browsingContext.fragmentNavigated',
                'network.responseCompleted',
                'network.beforeRequestSent',
                'network.fetchError'
            ]
        }).then(() => true, () => false)
        this.#browser.on('browsingContext.navigationStarted', this.#navigationStartedListener)
        this.#browser.on('browsingContext.fragmentNavigated', this.#navigationStartedListener)
        this.#browser.on('network.responseCompleted', this.#responseCompletedListener)
        this.#browser.on('network.beforeRequestSent', this.#beforeRequestSentListener)
        this.#browser.on('network.fetchError', this.#fetchErrorListener)
    }

    removeListeners(): void {
        super.removeListeners()
        this.#browser.off('browsingContext.navigationStarted', this.#navigationStartedListener)
        this.#browser.off('browsingContext.fragmentNavigated', this.#navigationStartedListener)
        this.#browser.off('network.responseCompleted', this.#responseCompletedListener)
        this.#browser.off('network.beforeRequestSent', this.#beforeRequestSentListener)
        this.#browser.off('network.fetchError', this.#fetchErrorListener)
    }

    async initialize () {
        return this.#initialize
    }

    #beforeRequestSent(log: local.NetworkBeforeRequestSentParameters) {
        /**
         * for events with navigation id we skip this step as we pull information
         * from the `navigationStarted` event
         */
        if (log.navigation) {
            return
        }

        const request = this.#findRootRequest(log.navigation)
        if (!request) {
            return
        }

        const { request: id, headers, cookies, url } = log.request
        request.children?.push({
            id,
            url,
            headers: headerListToObject(headers),
            cookies: cookies.map((cookie: local.NetworkCookie) => ({
                name: cookie.name,
                value: cookie.value.type === 'string' ? cookie.value.value : atob(cookie.value.value),
                domain: cookie.domain,
                path: cookie.path,
                size: cookie.size,
                httpOnly: cookie.httpOnly,
                secure: cookie.secure,
                sameSite: cookie.sameSite,
                expiry: cookie.expiry,
            })),
            timestamp: log.timestamp
        })

    }

    #navigationStarted(log: local.BrowsingContextNavigationInfo) {
        if (
            /**
             * we need a navigation id to identify the request
             */
            !log.navigation ||
            /**
             * ignore urls that users wouldn't navigate to
             */
            !SUPPORTED_NAVIGATION_PROTOCOLS.some((protocol) => log.url.startsWith(protocol))
        ) {
            /**
             * Chrome v127 and below does not support yet navigation ids, hence we have to
             * accept that we have to accept the event without it
             */
            if (log.navigation === null && log.url === '') {
                this.#lastNetworkId = UNKNOWN_NAVIGATION_ID
                return this.#requests.set(UNKNOWN_NAVIGATION_ID, {
                    url: '',
                    headers: {},
                    timestamp: log.timestamp,
                    redirectChain: [],
                    children: []
                })
            }

            return
        }

        this.#lastNetworkId = log.navigation
        this.#requests.set(log.navigation, {
            url: log.url,
            headers: {},
            timestamp: log.timestamp,
            navigation: log.navigation,
            redirectChain: [],
            children: []
        })
    }

    #fetchError (log: local.NetworkFetchErrorParameters) {
        const response = this.#findRootRequest(log.navigation)
        if (!response) {
            return
        }

        const request = response.children?.find((child) => child.id === log.request.request)
        if (!request) {
            return
        }
        request.error = log.errorText
    }

    #findRootRequest (navigationId: string | null) {
        const response = this.#requests.get(navigationId || UNKNOWN_NAVIGATION_ID)
        if (response) {
            return response
        }

        /**
         * Chrome v127 and below does not support yet navigation ids, hence we have to
         * just pick the first request object and assume it is the root request. This
         * will break if the user operates on multiple windows at the same time.
         *
         * @see https://github.com/GoogleChromeLabs/chromium-bidi/issues/1054
         */
        const firstRequest = this.#requests.values().next().value
        return this.#lastNetworkId
            ? this.#requests.get(this.#lastNetworkId) || firstRequest
            : firstRequest
    }

    #responseCompleted (log: local.NetworkResponseCompletedParameters) {
        const response = this.#findRootRequest(log.navigation)
        if (!response) {
            return
        }

        /**
         * patch for Chrome v127 and below
         */
        if (!response.navigation && response.url === '') {
            response.url = log.request.url
            response.navigation = log.navigation as string
        }

        /**
         * update main WebdriverIO.Request object
         */
        if (log.navigation === response.navigation) {
            if (response.url !== log.response.url) {
                response.redirectChain?.push(response.url)
            }
            response.url = log.response.url
            const { headers: requestHeaders } = log.request
            const { fromCache, headers: responseHeaders, mimeType, status } = log.response
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            response.headers = headerListToObject(requestHeaders),
            response.response = {
                fromCache,
                headers: headerListToObject(responseHeaders),
                mimeType,
                status
            }
            return
        }

        const request = response.children?.find((child) => child.id === log.request.request)
        if (!request) {
            return
        }
        request.response = {
            fromCache: log.response.fromCache,
            headers: headerListToObject(log.response.headers),
            mimeType: log.response.mimeType,
            status: log.response.status
        }
        response.children?.push(request)
    }

    getRequestResponseData(navigationId: string) {
        return this.#requests.get(navigationId)
    }

    /**
     * Returns the number of requests that are currently pending.
     * @param context browsing context id
     * @returns the number of requests that are currently pending
     */
    getPendingRequests(navigationId: string): WebdriverIO.Request[] {
        const request = this.#requests.get(navigationId)
        if (!request) {
            throw new Error(`Couldn't find request for navigation with id ${navigationId}`)
        }

        const subRequests = (request.children || [])
        /**
         * A request is pending, if:
         */
        return subRequests.filter((child) => (
            /**
             * either the request has no response yet
             */
            !child.response &&
            /**
             * and there was no request error
             */
            !child.error
        ))
    }
}

function headerListToObject(headers: local.NetworkHeader[]) {
    return headers.reduce((acc: Record<string, string>, { name, value }) => {
        acc[name] = value.value
        return acc
    }, {} as Record<string, string>)
}
