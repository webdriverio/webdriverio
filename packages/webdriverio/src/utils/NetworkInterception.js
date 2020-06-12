import atob from 'atob'
import minimatch from 'minimatch'

import { ERROR_REASON } from '../constants'

export default class NetworkInterception {
    constructor (url, filterOptions = {}) {
        this.url = url
        this.filterOptions = filterOptions
        this.respondOverwrites = []
        this.matches = new Set()
    }

    get calls () {
        return this.matches
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
                    (mock.filterOptions.method && mock.filterOptions.method.toLowerCase() !== request.method.toLowerCase())
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
                mock.matches.add(request)

                /**
                 * when response is modified
                 */
                if (mock.respondOverwrites.length) {
                    const { overwrite, params } = mock.respondOverwrites[0].sticky
                        ? mock.respondOverwrites[0]
                        : mock.respondOverwrites.shift()

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
                if (mock.abortErrorCode) {
                    return client.send('Fetch.failRequest', {
                        requestId,
                        errorReason: mock.abortErrorCode
                    })
                }
            }

            return client.send('Fetch.continueRequest', { requestId })
        }
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear () {
        this.matches = new Set()
    }

    /**
     * Does everything that `mock.clear()` does, and also
     * removes any mocked return values or implementations.
     */
    restore () {
        this.clear()
        delete this.requestOverwrite
        this.respondOverwrites = []
        delete this.abortErrorCode
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
    abort (errorCode) {
        if (typeof errorCode !== 'string' || !ERROR_REASON.includes(errorCode)) {
            throw new Error(`Invalid value for errorCode, allowed are: ${ERROR_REASON.join(', ')}`)
        }
        this.abortErrorCode = errorCode
    }
}
