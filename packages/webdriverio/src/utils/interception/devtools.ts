import fs from 'node:fs/promises'
import path from 'node:path'
import logger from '@wdio/logger'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Protocol } from 'devtools-protocol'

import Interception from './index.js'
import type { Matches, MockOverwrite, MockResponseParams } from './types.js'
import { containsHeaderObject } from '../index.js'
import { ERROR_REASON } from '../../constants.js'

const log = logger('webdriverio')

type ClientResponse = {
    body: string
    base64Encoded?: boolean
}

interface HeaderEntry {
    name: string;
    value: string;
}

type Event = {
    requestId: string
    request: Matches & { mockedResponse: string | Buffer }
    responseStatusCode?: number
    responseHeaders: HeaderEntry[]
}

type ExpectParameter<T> = ((param: T) => boolean) | T;

export default class DevtoolsInterception extends Interception {
    static handleRequestInterception (client: CDPSession, mocks: Set<Interception>): (event: Event) => Promise<void | ClientResponse> {
        return async (event) => {
            // responseHeaders and responseStatusCode are only present in Response stage
            // https://chromedevtools.github.io/devtools-protocol/tot/Fetch/#event-requestPaused
            const isRequest = !event.responseHeaders
            const eventResponseHeaders = event.responseHeaders || []
            const responseHeaders = eventResponseHeaders.reduce((headers, { name, value }) => {
                headers[name] = value
                return headers
            }, {} as Record<string, string>)
            const { requestId, request, responseStatusCode = 200 } = event

            for (const mock of mocks) {
                /**
                 * skip response mocks in Request stage
                 */
                if (isRequest && (
                    mock.respondOverwrites.length === 0 || // nothing to do in Request stage
                    (!mock.respondOverwrites[0].errorReason && // skip if not going to abort a request
                    // or want to fetch response
                    mock.respondOverwrites[0].params &&
                    mock.respondOverwrites[0].params.fetchResponse !== false)
                )) {
                    continue
                }

                /**
                 * match mock url
                 */
                if (!Interception.isMatchingRequest(mock.url, request.url)) {
                    continue
                }

                /**
                 * Add statusCode and responseHeaders to request to be used in expect-webdriverio
                 */
                request.statusCode = responseStatusCode
                request.responseHeaders = { ...responseHeaders }

                /**
                 * match filter options
                 */
                if (
                    filterMethod(request.method, mock.filterOptions.method) ||
                    filterHeaders(request.headers, mock.filterOptions.requestHeaders) ||
                    filterHeaders(responseHeaders, mock.filterOptions.headers) ||
                    filterRequest(request.postData, mock.filterOptions.postData) ||
                    filterStatusCode(responseStatusCode, mock.filterOptions.statusCode)
                ) {
                    continue
                }

                const { body, base64Encoded = undefined } = isRequest ? { body: '' } : await client.send(
                    'Fetch.getResponseBody',
                    { requestId }
                ).catch(/* istanbul ignore next */() => ({} as any))

                request.body = base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body

                const contentTypeHeader = Object.keys(responseHeaders).find(h => h.toLowerCase() === 'content-type') || ''
                const responseContentType = responseHeaders[contentTypeHeader]
                request.body = responseContentType && responseContentType.includes('application/json')
                    ? tryParseJson(request.body as string)
                    : request.body
                mock.matches.push(request)

                /**
                 * no stubbing if no overwrites were defined
                 */
                if (mock.respondOverwrites.length === 0) {
                    continue
                }

                const { errorReason, overwrite, params = {} } = mock.respondOverwrites[0].sticky
                    ? mock.respondOverwrites[0]
                    : mock.respondOverwrites.shift() || {}

                /**
                 * when response is modified
                 */
                if (overwrite !== undefined) {
                    let newBody = overwrite
                    if (typeof overwrite === 'function') {
                        newBody = await overwrite(request, client)
                    }

                    const isBodyUndefined = typeof newBody === 'undefined'
                    if (isBodyUndefined) {
                        newBody = ''
                    }

                    if (typeof newBody !== 'string') {
                        newBody = JSON.stringify(newBody)
                    }

                    let responseCode = typeof params.statusCode === 'function' ? params.statusCode(request) : params.statusCode || responseStatusCode
                    let responseHeaders: HeaderEntry[] = [
                        ...eventResponseHeaders,
                        ...Object.entries(typeof params.headers === 'function' ? params.headers(request) : params.headers || {}).map(([name, value]) => ({ name, value }))
                    ]

                    /**
                     * check if local file and load it
                     */
                    const responseFilePath = path.isAbsolute(newBody) ? newBody : path.join(process.cwd(), newBody)
                    const responseFileAccessible = await fs.access(responseFilePath).then(() => true, () => false)
                    if (newBody.length > 0 && responseFileAccessible) {
                        newBody = (await fs.readFile(responseFilePath))
                    } else if (newBody.startsWith('http')) {
                        responseCode = 301
                        /**
                         * filter out possible available location header
                         */
                        responseHeaders = responseHeaders.filter(
                            ({ name }) => name.toLowerCase() !== 'location')
                        responseHeaders.push({ name: 'Location', value: newBody })
                    }

                    request.mockedResponse = newBody as string | Buffer
                    return client.send('Fetch.fulfillRequest', {
                        requestId,
                        responseCode,
                        responseHeaders,
                        /** do not mock body if it's undefined */
                        body: isBodyUndefined ? undefined : (newBody instanceof Buffer ? newBody : Buffer.from(newBody as string, 'utf8')).toString('base64')
                    }).catch(/* istanbul ignore next */logFetchError)
                }

                /**
                 * when request is aborted
                 */
                if (errorReason) {
                    return client.send('Fetch.failRequest', {
                        requestId,
                        errorReason
                    }).catch(/* istanbul ignore next */logFetchError)
                }
            }

            return client.send('Fetch.continueRequest', { requestId }).catch(/* istanbul ignore next */logFetchError)
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
    respond (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        this.respondOverwrites.push({ overwrite, params, sticky: true })
    }

    /**
     * Respond request once with given overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respondOnce (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        this.respondOverwrites.push({ overwrite, params })
    }

    /**
     * Abort the request with an error code
     * @param {string} errorCode  error code of the response
     */
    abort (errorReason: Protocol.Network.ErrorReason, sticky: boolean = true) {
        if (typeof errorReason !== 'string' || !ERROR_REASON.includes(errorReason)) {
            throw new Error(`Invalid value for errorReason, allowed are: ${ERROR_REASON.join(', ')}`)
        }
        this.respondOverwrites.push({ errorReason, sticky })
    }

    /**
     * Abort the request once with an error code
     * @param {string} errorReason  error code of the response
     */
    abortOnce (errorReason: Protocol.Network.ErrorReason) {
        this.abort(errorReason, false)
    }
}

const filterMethod = (method: string, expected?: ExpectParameter<string>) => {
    if (typeof expected === 'undefined') {
        return false
    }
    if (typeof expected === 'function') {
        return expected(method) !== true
    }
    return expected.toLowerCase() !== method.toLowerCase()
}

const filterHeaders = (responseHeaders: Record<string, string>, expected?: ExpectParameter<Record<string, string>>) => {
    if (typeof expected === 'undefined') {
        return false
    }
    if (typeof expected === 'function') {
        return expected(responseHeaders) !== true
    }
    return !containsHeaderObject(responseHeaders, expected)
}

const filterRequest = (postData?: string, expected?: ExpectParameter<string | undefined>) => {
    if (typeof expected === 'undefined') {
        return false
    }
    if (typeof expected === 'function') {
        return expected(postData) !== true
    }
    return postData !== expected
}

const filterStatusCode = (statusCode: number, expected?: ExpectParameter<number>) => {
    if (typeof expected === 'undefined') {
        return false
    }
    if (typeof expected === 'function') {
        return expected(statusCode) !== true
    }
    return statusCode !== expected
}

const tryParseJson = (body: string) => {
    try {
        return JSON.parse(body) || body
    } catch {
        return body
    }
}

const logFetchError = (err?: Error) => {
    /* istanbul ignore next */
    log.debug(err?.message)
}
