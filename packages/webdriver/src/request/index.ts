import { EventEmitter } from 'events'
import path from 'path'
import type { URL } from 'url'
import { URLFactory } from './factory'

import logger from '@wdio/logger'
import { transformCommandLogResult } from '@wdio/utils'
import type { Options } from '@wdio/types'

import { isSuccessfulResponse, getErrorFromResponseBody, getTimeoutError } from '../utils'

const pkg = require('../../package.json')

type Agents = Options.Agents
type RequestLibOptions = Options.RequestLibOptions
type RequestLibResponse = Options.RequestLibResponse
type RequestOptions = Omit<Options.WebDriver, 'capabilities'>

export class RequestLibError extends Error {
    statusCode?: number
    body?: any
    code?: string
}

export interface WebDriverResponse {
    value: any
    /**
     * error case
     * https://w3c.github.io/webdriver/webdriver-spec.html#dfn-send-an-error
     */
    error?: string
    message?: string
    stacktrace?: string

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

export default abstract class WebDriverRequest extends EventEmitter {
    body?: Record<string, unknown>
    method: string
    endpoint: string
    isHubCommand: boolean
    requiresSessionId: boolean
    defaultAgents: Agents | null
    defaultOptions: RequestLibOptions = {
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
        this.defaultAgents = null
        this.requiresSessionId = Boolean(this.endpoint.match(/:sessionId/))
    }

    makeRequest (options: RequestOptions, sessionId?: string) {
        let fullRequestOptions: RequestLibOptions = Object.assign({
            method: this.method
        }, this.defaultOptions, this._createOptions(options, sessionId))
        if (typeof options.transformRequest === 'function') {
            fullRequestOptions = options.transformRequest(fullRequestOptions)
        }

        this.emit('request', fullRequestOptions)
        return this._request(fullRequestOptions, options.transformResponse, options.connectionRetryCount, 0)
    }

    protected _createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false): RequestLibOptions {
        const agent = isBrowser ? undefined : (options.agent || this.defaultAgents)
        const searchParams = isBrowser ?
            undefined :
            (typeof options.queryParams === 'object' ? options.queryParams : {})
        const requestOptions: RequestLibOptions = {
            https: {},
            agent,
            headers: {
                ...DEFAULT_HEADERS,
                ...(typeof options.headers === 'object' ? options.headers : {})
            },
            searchParams,
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

        requestOptions.url = URLFactory.getInstance(
            `${options.protocol}://` +
            `${options.hostname}:${options.port}` +
            (this.isHubCommand ? this.endpoint : path.join(options.path || '', endpoint))
        )

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

    protected async _libRequest(url: URL, options: RequestLibOptions): Promise<RequestLibResponse> { // eslint-disable-line @typescript-eslint/no-unused-vars
        throw new Error('This function must be implemented')
    }

    private async _request (
        fullRequestOptions: RequestLibOptions,
        transformResponse?: (response: RequestLibResponse, requestOptions: RequestLibOptions) => RequestLibResponse,
        totalRetryCount = 0,
        retryCount = 0
    ): Promise<WebDriverResponse> {
        log.info(`[${fullRequestOptions.method}] ${(fullRequestOptions.url as URL).href}`)

        if (fullRequestOptions.json && Object.keys(fullRequestOptions.json).length) {
            log.info('DATA', transformCommandLogResult(fullRequestOptions.json))
        }

        const { url, ...requestLibOptions } = fullRequestOptions
        let response = await this._libRequest(url!, requestLibOptions)
            // @ts-ignore
            .catch((err: RequestLibError) => {
                return err
            })

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
            if ((response as RequestLibError).code === 'ETIMEDOUT') {
                const error = getTimeoutError(response, fullRequestOptions)

                return retry(error, 'Request timed out! Consider increasing the "connectionRetryTimeout" option.')
            }

            /**
             * throw if request error is unknown
             */
            throw response
        }

        if (typeof transformResponse === 'function') {
            response = transformResponse(response, fullRequestOptions) as RequestLibResponse
        }

        const error = getErrorFromResponseBody(response.body)

        /**
         * retry connection refused errors
         */
        if (error.message === 'java.net.ConnectException: Connection refused: connect') {
            return retry(error, 'Connection to Selenium Standalone server was refused.')
        }

        /**
         * hub commands don't follow standard response formats
         * and can have empty bodies
         */
        if (this.isHubCommand) {
            /**
             * if body contains HTML the command was called on a node
             * directly without using a hub, therefore throw
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
