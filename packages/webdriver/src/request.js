import url from 'url'
import http from 'http'
import path from 'path'
import https from 'https'
import request from 'request'
import EventEmitter from 'events'

import logger from '@wdio/logger'

import { isSuccessfulResponse, getErrorFromResponseBody } from './utils'
import pkg from '../package.json'

const DEFAULT_HEADERS = {
    'Connection': 'keep-alive',
    'Accept': 'application/json',
    'User-Agent': 'webdriver/' + pkg.version
}

const log = logger('webdriver')
const agents = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}

export default class WebDriverRequest extends EventEmitter {
    constructor (method, endpoint, body, isHubCommand) {
        super()
        this.body = body
        this.method = method
        this.endpoint = endpoint
        this.isHubCommand = isHubCommand
        this.requiresSessionId = this.endpoint.match(/:sessionId/)
        this.defaultOptions = {
            method,
            followAllRedirects: true,
            json: true
        }
    }

    makeRequest (options, sessionId) {
        let fullRequestOptions = Object.assign({}, this.defaultOptions, this._createOptions(options, sessionId))
        if (typeof options.transformRequest === 'function') {
            fullRequestOptions = options.transformRequest(fullRequestOptions)
        }

        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.transformResponse, options.connectionRetryCount)
    }

    _createOptions (options, sessionId) {
        const requestOptions = {
            agent: options.agent || agents[options.protocol],
            headers: {
                ...DEFAULT_HEADERS,
                ...(typeof options.headers === 'object' ? options.headers : {})
            },
            qs: typeof options.queryParams === 'object' ? options.queryParams : {},
            timeout: options.connectionRetryTimeout
        }

        /**
         * only apply body property if existing
         */
        if (this.body && (Object.keys(this.body).length || this.method === 'POST')) {
            const contentLength = Buffer.byteLength(JSON.stringify(this.body), 'utf8')
            requestOptions.body = this.body
            requestOptions.headers = {
                ...requestOptions.headers,
                ...({ 'Content-Length': contentLength })
            }
        }

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (this.requiresSessionId && !sessionId) {
            throw new Error('A sessionId is required for this command')
        }

        requestOptions.uri = url.parse(
            `${options.protocol}://` +
            `${options.hostname}:${options.port}` +
            (this.isHubCommand
                ? this.endpoint
                : path.join(options.path, this.endpoint.replace(':sessionId', sessionId)))
        )

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.user && options.key) {
            requestOptions.auth = {
                user: options.user,
                pass: options.key
            }
        }

        /**
         * if the environment variable "STRICT_SSL" is defined as "false", it doesn't require SSL certificates to be valid.
         */
        requestOptions.strictSSL = !(process.env.STRICT_SSL === 'false' || process.env.strict_ssl === 'false')

        return requestOptions
    }

    _request (fullRequestOptions, transformResponse, totalRetryCount = 0, retryCount = 0) {
        log.info(`[${fullRequestOptions.method}] ${fullRequestOptions.uri.href}`)

        if (fullRequestOptions.body && Object.keys(fullRequestOptions.body).length) {
            log.info('DATA', fullRequestOptions.body)
        }

        return new Promise((resolve, reject) => request(fullRequestOptions, (err, response) => {
            if (typeof transformResponse === 'function') {
                response = transformResponse(response, fullRequestOptions)
            }

            let body = response && response.body
            const error = err || getErrorFromResponseBody(body)

            /**
             * hub commands don't follow standard response formats
             * and can have empty bodies
             */
            if (this.isHubCommand) {
                /**
                 * if body contains HTML the command was called on a node
                 * directly without using a hub, therefor throw
                 */
                if (typeof body === 'string' && body.startsWith('<!DOCTYPE html>')) {
                    return reject(new Error('Command can only be called to a Selenium Hub'))
                }

                body = { value: body || null }
            }

            /**
             * Resolve only if successful response
             */
            if (!err && isSuccessfulResponse(response.statusCode, body)) {
                this.emit('response', { result: body })
                return resolve(body)
            }

            /**
             *  stop retrying as this will never be successful.
             *  we will handle this at the elementErrorHandler
             */
            if(error.name === 'stale element reference') {
                log.warn('Request encountered a stale element - terminating request')
                this.emit('response', { error })
                return reject(error)
            }

            /**
             * stop retrying if totalRetryCount was exceeded or there is no reason to
             * retry, e.g. if sessionId is invalid
             */
            if (retryCount >= totalRetryCount || error.message.includes('invalid session id')) {
                log.error('Request failed due to', error)
                this.emit('response', { error })
                return reject(error)
            }

            ++retryCount
            this.emit('retry', { error, retryCount })
            log.warn('Request failed due to', error.message)
            log.info(`Retrying ${retryCount}/${totalRetryCount}`)
            this._request(fullRequestOptions, transformResponse, totalRetryCount, retryCount).then(resolve, reject)
        }))
    }
}
