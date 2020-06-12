import atob from 'atob'
import minimatch from 'minimatch'

import { containsObject } from './'
import { ERROR_REASON } from '../constants'

export default class NetworkInterception {
    constructor (url, filterOptions = {}) {
        this.url = url
        this.filterOptions = filterOptions
        this.respondOverwrites = []
        this.matches = []
    }

    static handleRequestInterception (client, mocks) {
        return async (event) => {
            const responseHeaders = event.responseHeaders.reduce((headers, { name, value }) => {
                headers[name] = value
                return headers
            }, {})
            const { requestId, request } = event

            for (const mock of mocks) {
                /**
                 * match mock url
                 */
                if (!minimatch(request.url, mock.url)) {
                    continue
                }

                /**
                 * match filter options
                 */
                if (
                    /**
                     * HTTP method
                     */
                    (mock.filterOptions.method && mock.filterOptions.method.toLowerCase() !== request.method.toLowerCase()) ||
                    (mock.filterOptions.headers && containsObject(responseHeaders, mock.filterOptions.headers))
                ) {
                    continue
                }

                const { body, base64Encoded } = await client.send(
                    'Fetch.getResponseBody',
                    { requestId }
                )

                request.body = base64Encoded ? atob(body) : body
                request.body = responseHeaders['Content-Type'] && responseHeaders['Content-Type'].includes('application/json')
                    ? JSON.parse(request.body)
                    : request.body
                mock.matches.push(request)

                /**
                 * no stubbing if no overwrites were defined
                 */
                if (mock.respondOverwrites.length === 0) {
                    continue
                }

                const { errorReason, overwrite, params } = mock.respondOverwrites[0].sticky
                    ? mock.respondOverwrites[0]
                    : mock.respondOverwrites.shift()

                /**
                 * when response is modified
                 */
                if (overwrite) {
                    let body = overwrite
                    if (typeof overwrite === 'function') {
                        body = await overwrite(request, client)
                    }

                    request.mockedResponse = body
                    if (typeof body !== 'string') {
                        body = JSON.stringify(body)
                    }

                    return client.send('Fetch.fulfillRequest', {
                        requestId,
                        responseCode: params.statusCode || event.responseStatusCode,
                        responseHeaders: [
                            ...event.responseHeaders,
                            ...Object.entries(params.headers || {}).map(([key, value]) => { key, value })
                        ],
                        body: Buffer.from(body).toString('base64')
                    })
                }

                /**
                 * when request is aborted
                 */
                if (errorReason) {
                    return client.send('Fetch.failRequest', {
                        requestId,
                        errorReason
                    })
                }
            }

            return client.send('Fetch.continueRequest', { requestId })
        }
    }

    /**
     * allows access to all requests made with given pattern
     */
    get calls () {
        return this.matches
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear () {
        this.matches = []
    }

    /**
     * Does everything that `mock.clear()` does, and also
     * removes any mocked return values or implementations.
     */
    restore () {
        this.clear()
        this.respondOverwrites = []
    }

    /**
     * Always respond with same overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respond (overwrite, params = {}) {
        this.respondOverwrites.push({ overwrite, params, sticky: true })
    }

    /**
     * Respond request once with given overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respondOnce (overwrite, params = {}) {
        this.respondOverwrites.push({ overwrite, params })
    }

    /**
     * Abort the request with an error code
     * @param {string} errorCode  error code of the response
     */
    abort (errorReason, sticky = true) {
        if (typeof errorReason !== 'string' || !ERROR_REASON.includes(errorReason)) {
            throw new Error(`Invalid value for errorReason, allowed are: ${ERROR_REASON.join(', ')}`)
        }
        this.respondOverwrites.push({ errorReason, sticky })
    }

    /**
     * Abort the request once with an error code
     * @param {string} errorReason  error code of the response
     */
    abortOnce (errorReason) {
        this.abort(errorReason, false)
    }
}
