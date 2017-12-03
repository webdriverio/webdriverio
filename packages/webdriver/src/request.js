import url from 'url'
import http from 'http'
import https from 'https'
import request from 'request'

import { isSuccessfulResponse } from './utils'
import pkg from '../package.json'

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

export default class WebDriverRequest {
    constructor (method, endpoint, body) {
        this.method = method
        this.endpoint = endpoint
        this.body = body
        this.defaultOptions = {
            method,
            json: true,
            followAllRedirects: true,
            headers: {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'User-Agent': 'webdriver/' + pkg.version
            }
        }
    }

    makeRequest (options, sessionId) {
        const fullRequestOptions = this._createOptions(options, sessionId)
        return this._request(fullRequestOptions, options.connectionRetryCount).then(({ body }) => {
            const sessionId = body.sessionId || body.value.sessionId
            return { body, sessionId }
        })
    }

    _createOptions (options, sessionId) {
        const requestOptions = {}

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (this.endpoint.match(/:sessionId/) && !sessionId) {
            throw new Error('A sessionId is required for this command')
        }

        requestOptions.uri = url.parse(
            `${options.protocol}://` +
            `${options.hostname}:${options.port}` +
            `${options.path}${this.endpoint.replace(':sessionId', sessionId)}`
        )

        if (options.protocol === 'http') {
            requestOptions.agent = httpAgent
        } else if (options.protocol === 'https') {
            requestOptions.agent = httpsAgent
        } else {
            throw new Error(`Unsupported protocol, must be http or https: ${options.protocol}`)
        }

        /**
         * Check for custom authorization header
         */
        if (typeof options.headers === 'object') {
            requestOptions.headers = Object.assign(requestOptions.headers, options.headers)
        }

        /**
         * Add query parameters to request options if it is an object
         */
        if (typeof this.defaultOptions.queryParams === 'object') {
            requestOptions.qs = options.queryParams
        }

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.auth) {
            requestOptions.auth = this.auth
        }

        if (this.method === 'POST') {
            requestOptions.json = this.body
        }

        return requestOptions
    }

    _request (fullRequestOptions, totalRetryCount, retryCount = 0) {
        return new Promise((resolve, reject) => {
            request(fullRequestOptions, (err, response, body) => {
                /**
                 * Resolve only if successful response
                 */
                if (!err && isSuccessfulResponse(response)) {
                    return resolve({body, response})
                }

                if (retryCount >= totalRetryCount) {
                    // ToDo make proper request error
                    return reject(new Error('request failed'))
                }

                this._request(fullRequestOptions, totalRetryCount, ++retryCount)
                    .then(resolve)
                    .catch(reject)
            })
        })
    }
}
