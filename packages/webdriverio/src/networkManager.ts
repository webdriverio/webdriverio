import { type local } from 'webdriver'

export const networkManager = new Map<WebdriverIO.Browser, NetworkManager>()

export function getNetworkManager(browser: WebdriverIO.Browser) {
    const existingNetworkManager = networkManager.get(browser)
    if (existingNetworkManager) {
        return existingNetworkManager
    }

    const newContext = new NetworkManager(browser)
    networkManager.set(browser, newContext)
    return newContext
}

type Context = string

/**
 * This class is responsible for managing shadow roots and their elements.
 * It allows to do deep element lookups and pierce into shadow DOMs across
 * all components of a page.
 */
export class NetworkManager {
    #browser: WebdriverIO.Browser
    #initialize: Promise<boolean>
    #requests = new Map<Context, WebdriverIO.Request>()

    constructor(browser: WebdriverIO.Browser) {
        this.#browser = browser

        /**
         * don't run setup when Bidi is not supported or running unit tests
         */
        if (!browser.isBidi || process.env.VITEST_WORKER_ID || browser.options?.automationProtocol !== 'webdriver') {
            this.#initialize = Promise.resolve(true)
            return
        }

        /**
         * listen on required bidi events
         */
        this.#initialize = this.#browser.sessionSubscribe({
            events: [
                'browsingContext.navigationStarted',
                'network.responseCompleted',
                'network.beforeRequestSent',
                'network.fetchError'
            ]
        }).then(() => true, () => false)
        this.#browser.on('browsingContext.navigationStarted', this.#navigationStarted.bind(this))
        this.#browser.on('network.responseCompleted', this.#responseCompleted.bind(this))
        this.#browser.on('network.beforeRequestSent', this.#beforeRequestSent.bind(this))
        this.#browser.on('network.fetchError', this.#fetchError.bind(this))
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

        const request = log.context ? this.#requests.get(log.context) : undefined
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
             * ignore urls that do not start with http
             */
            !log.url.startsWith('http')
        ) {
            return
        }

        this.#requests.set(log.context, {
            url: log.url,
            headers: {},
            timestamp: log.timestamp,
            navigation: log.navigation,
            redirectChain: [],
            children: []
        })
    }

    #fetchError (log: local.NetworkFetchErrorParameters) {
        const response = log.context ? this.#requests.get(log.context) : undefined
        if (!response) {
            return
        }

        const request = response.children?.find((child) => child.id === log.request.request)
        if (!request) {
            return
        }
        request.error = log.errorText
    }

    #responseCompleted (log: local.NetworkResponseCompletedParameters) {
        const response = log.context ? this.#requests.get(log.context) : undefined
        if (!response) {
            return
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

    getRequestResponseData(context: Context) {
        return this.#requests.get(context)
    }

    /**
     * Returns the number of requests that are currently pending.
     * @param context browsing context id
     * @returns the number of requests that are currently pending
     */
    getPendingRequests(context: Context) {
        const request = this.#requests.get(context)
        if (!request) {
            throw new Error(`Couldn't find request for context ${context}`)
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
