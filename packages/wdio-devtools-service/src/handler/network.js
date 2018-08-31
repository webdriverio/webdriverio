import { IGNORED_URLS } from '../constants'

export default class NetworkHandler {
    constructor (cdp) {
        this.requestLog = { requests: [] }
        this.requestTypes = {}
        this.cachedFirstRequest = null

        cdp.on('Network.dataReceived', ::this.onDataReceived)
        cdp.on('Network.responseReceived', ::this.onNetworkResponseReceived)
        cdp.on('Network.requestWillBeSent', ::this.onNetworkRequestWillBeSent)
        cdp.on('Page.frameNavigated', ::this.onPageFrameNavigated)
    }

    findRequest (params) {
        let request = this.requestLog.requests.find((req) => req.id === params.requestId)

        /**
         * If no match is found, check if the corresponding request is the cached first request
         */
        if (!request && this.cachedFirstRequest && this.cachedFirstRequest.id === params.requestId) {
            request = this.cachedFirstRequest
        }
        return request
    }

    onDataReceived (params) {
        let request = this.findRequest(params)

        /**
         * ensure that
         *  - a requestWillBeSent event was triggered before
         *  - the request type is accurate and known (sometimes this is not the case when `Network.requestWillBeSent` is triggered)
         */
        if (!request || !this.requestTypes[request.type]) {
            return
        }

        this.requestTypes[request.type].size += parseInt(params.dataLength, 10)
        this.requestTypes[request.type].encoded += parseInt(params.encodedDataLength, 10)
    }

    onNetworkResponseReceived (params) {
        let request = this.findRequest(params)
        /**
         * ensure that a requestWillBeSent event was triggered before
         */
        if (!request) {
            return
        }

        request.statusCode = params.response.status
        request.requestHeaders = params.response.requestHeaders
        request.responseHeaders = params.response.headers
        request.timing = params.response.timing
        request.type = params.type
    }

    onNetworkRequestWillBeSent (params) {
        let isFirstRequestOfFrame = false

        if (
            /**
             * A new page was opened when request type is a document.
             * The first request is sent before the Page.frameNavigated event is triggered,
             * so this request must be cached to be able to add it to the requestLog later.
             */
            params.type === 'Document' &&
            /**
             * ensure that only page loads triggered by non scripts (devtools only) are considered
             * new page loads
             */
            params.initiator.type === 'other' &&
            /**
             * ignore pages not initated by the user
             */
            IGNORED_URLS.filter((url) => params.request.url.startsWith(url)).length === 0
        ) {
            isFirstRequestOfFrame = true

            /**
             * reset the request type sizes
             */
            this.requestTypes = {}
        }

        const log = {
            id: params.requestId,
            url: params.request.url,
            method: params.request.method
        }

        if (params.redirectResponse) {
            log.redirect = {
                url: params.redirectResponse.url,
                statusCode: params.redirectResponse.status,
                requestHeaders: params.redirectResponse.requestHeaders,
                responseHeaders: params.redirectResponse.headers,
                timing: params.redirectResponse.timing
            }
        }

        if (!this.requestTypes[params.type]) {
            this.requestTypes[params.type] = {
                size: 0,
                encoded: 0,
                count: 1
            }
        } else {
            this.requestTypes[params.type].count++
        }

        if (isFirstRequestOfFrame) {
            log.loaderId = params.loaderId
            this.cachedFirstRequest = log
            return
        }
        return this.requestLog.requests.push(log)
    }

    onPageFrameNavigated (params) {
        /**
         * Only create a requestLog for pages that don't have a parent frame.
         * I.e. iframes are ignored
         */
        if (!params.frame.parentId && IGNORED_URLS.filter((url) => params.frame.url.startsWith(url)).length === 0) {
            this.requestLog = {
                id: params.frame.loaderId,
                url: params.frame.url,
                requests: []
            }
            /**
             * Add the first request that was cached before the actual requestLog could be created
             */
            if (this.cachedFirstRequest && this.cachedFirstRequest.loaderId === params.frame.loaderId) {
                /**
                 * Delete the loaderId of the first request so that all request data has the same structure
                 */
                delete this.cachedFirstRequest.loaderId
                this.requestLog.requests.push(this.cachedFirstRequest)
                this.cachedFirstRequest = null
            }
        }
    }
}
