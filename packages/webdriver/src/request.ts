import path from 'path'
import http from 'http'
import https from 'https'
import { EventEmitter } from 'events'

import * as got from 'got'
import logger from '@wdio/logger'
import { transformCommandLogResult } from '@wdio/utils'

import { Options } from './types'
import { isSuccessfulResponse, getErrorFromResponseBody } from './utils'

const pkg = require('../package.json')

export interface WebDriverResponse {
    value: any
    /**
     * JSONWP property
     */
    status?: number
    sessionId?: string
}

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
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
    body?: Record<string, unknown>
    method: string
    endpoint: string
    isHubCommand: boolean
    requiresSessionId: boolean
    defaultOptions: got.Options = {
        retry: 0, // we have our own retry mechanism
        followRedirect: true,
        responseType: 'json',
        throwHttpErrors: false
    }

    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super()
        this.body = body
        this.method = method
        this.endpoint = endpoint
        this.isHubCommand = isHubCommand
        this.requiresSessionId = Boolean(this.endpoint.match(/:sessionId/))
    }

    makeRequest (options: Options, sessionId?: string) {
        let fullRequestOptions: got.Options = Object.assign({
            method: this.method
        }, this.defaultOptions, this._createOptions(options, sessionId))
        if (typeof options.transformRequest === 'function') {
            fullRequestOptions = options.transformRequest(fullRequestOptions)
        }

        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.transformResponse, options.connectionRetryCount, 0)
    }

    private _createOptions (options: Options, sessionId?: string): got.Options {
        const requestOptions: got.Options = {
            https: {},
            agent: options.agent || agents,
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
            requestOptions.headers!['Content-Length'] = `${contentLength}`
        }

        /**
         * if we don't have a session id we set it here, unless we call commands that don't require session ids, for
         * example /sessions. The call to /sessions is not connected to a session itself and it therefore doesn't
         * require it
         */
        let endpoint = this.endpoint
        if (this.requiresSessionId) {
            if (!sessionId) {
                throw new Error('A sessionId is required for this command')
            }
            endpoint = endpoint.replace(':sessionId', sessionId)
        }

        requestOptions.url = new URL(
            `${options.protocol}://` +
            `${options.hostname}:${options.port}` +
            (this.isHubCommand ? this.endpoint : path.join(options.path || '', endpoint))
        ) as import('url').URL

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.user && options.key) {
            requestOptions.username = options.user
            requestOptions.password = options.key
        }

        /**
         * if the environment variable "STRICT_SSL" is defined as "false", it doesn't require SSL certificates to be valid.
         * Or the requestOptions has strictSSL for an environment which cannot get the environment variable correctly like on an Electron app.
         */
        requestOptions.https!.rejectUnauthorized = !(
            options.strictSSL === false ||
            process.env.STRICT_SSL === 'false' ||
            process.env.strict_ssl === 'false'
        )

        return requestOptions
    }

    private async _request (
        fullRequestOptions: got.Options,
        transformResponse?: (response: got.Response, requestOptions: got.HTTPSOptions) => got.Response,
        totalRetryCount = 0,
        retryCount = 0
    ): Promise<WebDriverResponse> {
        log.info(`[${fullRequestOptions.method}] ${(fullRequestOptions.url as URL).href}`)

        if (fullRequestOptions.json && Object.keys(fullRequestOptions.json).length) {
            log.info('DATA', transformCommandLogResult(fullRequestOptions.json))
        }

        const { url, ...gotOptions } = fullRequestOptions
        let response = await got.default(url!, gotOptions)
            // @ts-ignore
            .catch((err: got.RequestError) => err)

        /**
         * handle retries for requests
         * @param {Error} error  error object that causes the retry
         * @param {String} msg   message that is being shown as warning to user
         */
        const retry = (error: Error, msg: string) => {
            /**
             * stop retrying if totalRetryCount was exceeded or there is no reason to
             * retry, e.g. if sessionId is invalid
             */
            if (retryCount >= totalRetryCount || error.message.includes('invalid session id')) {
                log.error(`Request failed with status ${response.statusCode} due to ${error}`)
                this.emit('response', { error })
                throw error
            }

            ++retryCount
            this.emit('retry', { error, retryCount })
            log.warn(msg)
            log.info(`Retrying ${retryCount}/${totalRetryCount}`)
            return this._request(fullRequestOptions, transformResponse, totalRetryCount, retryCount)
        }

        /**
         * handle request errors
         */
        if (response instanceof Error) {
            /**
             * handle timeouts
             */
            if ((response as got.RequestError).code === 'ETIMEDOUT') {
                return retry(response, 'Request timed out! Consider increasing the "connectionRetryTimeout" option.')
            }

            /**
             * throw if request error is unknown
             */
            throw response
        }

        if (typeof transformResponse === 'function') {
            response = transformResponse(response, fullRequestOptions) as got.Response<string>
        }

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
        if (error.name === 'stale element reference') {
            log.warn('Request encountered a stale element - terminating request')
            this.emit('response', { error })
            throw error
        }

        return retry(error, `Request failed with status ${response.statusCode} due to ${error.message}`)
    }
}
