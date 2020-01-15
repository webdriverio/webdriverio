import path from 'path'
import http from 'http'
import https from 'https'
import EventEmitter from 'events'

import got from 'got'
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
            retry: 0, // we have our own retry mechanism
            followRedirect: true,
            responseType: 'json',
            throwHttpErrors: false
        }
    }

    makeRequest (options, sessionId) {
        const fullRequestOptions = Object.assign({}, this.defaultOptions, this._createOptions(options, sessionId))
        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.connectionRetryCount)
    }

    _createOptions (options, sessionId) {
        const requestOptions = {
            agent: options.agent || agents[options.protocol],
            headers: {
                ...DEFAULT_HEADERS,
                ...(typeof options.headers === 'object' ? options.headers : {})
            },
            searchParams: typeof options.queryParams === 'object' ? options.queryParams : {},
            timeout: options.connectionRetryTimeout
        }

        /**
         * only apply body property if existing
         */
        if (this.body && (Object.keys(this.body).length || this.method === 'POST')) {
            const contentLength = Buffer.byteLength(JSON.stringify(this.body), 'utf8')
            requestOptions.json = this.body
            requestOptions.headers['Content-Length'] = contentLength
        }

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        if (this.requiresSessionId && !sessionId) {
            throw new Error('A sessionId is required for this command')
        }

        requestOptions.uri = new URL(
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
            requestOptions.auth = `${options.user}:${options.key}`
        }

        /**
         * if the environment variable "STRICT_SSL" is defined as "false", it doesn't require SSL certificates to be valid.
         */
        requestOptions.rejectUnauthorized = !(process.env.STRICT_SSL === 'false' || process.env.strict_ssl === 'false')

        return requestOptions
    }

    async _request (fullRequestOptions, totalRetryCount = 0, retryCount = 0) {
        log.info(`[${fullRequestOptions.method}] ${fullRequestOptions.uri.href}`)

        if (fullRequestOptions.json && Object.keys(fullRequestOptions.json).length) {
            log.info('DATA', fullRequestOptions.json)
        }

        const response = await got(fullRequestOptions.uri, fullRequestOptions)
        const error = getErrorFromResponseBody(response.body)

        /**
         * hub commands don't follow standard response formats
         * and can have empty bodies
         */
        if (this.isHubCommand) {
            /**
             * if body contains HTML the command was called on a node
             * directly without using a hub, therefor throw
             */
            if (typeof response.body === 'string' && response.body.startsWith('<!DOCTYPE html>')) {
                return Promise.reject(new Error('Command can only be called to a Selenium Hub'))
            }

            return { value: response.body || null }
        }

        /**
         * Resolve only if successful response
         */
        if (isSuccessfulResponse(response.statusCode, response.body)) {
            this.emit('response', { result: response.body })
            return response.body
        }

        /**
         *  stop retrying as this will never be successful.
         *  we will handle this at the elementErrorHandler
         */
        if(error.name === 'stale element reference') {
            log.warn('Request encountered a stale element - terminating request')
            this.emit('response', { error })
            throw error
        }

        /**
         * stop retrying if totalRetryCount was exceeded or there is no reason to
         * retry, e.g. if sessionId is invalid
         */
        if (retryCount >= totalRetryCount || error.message.includes('invalid session id')) {
            log.error('Request failed due to', error)
            this.emit('response', { error })
            throw error
        }

        ++retryCount
        this.emit('retry', { error, retryCount })
        log.warn('Request failed due to', error.message)
        log.info(`Retrying ${retryCount}/${totalRetryCount}`)
        return this._request(fullRequestOptions, totalRetryCount, retryCount)
    }
}
