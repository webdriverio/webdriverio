import logger from '@wdio/logger'
import { transformCommandLogResult, sleep } from '@wdio/utils'
import type { Options } from '@wdio/types'

import  { WebDriverResponseError, WebDriverRequestError } from './error.js'
import { RETRYABLE_STATUS_CODES, RETRYABLE_ERROR_CODES } from './constants.js'
import type { WebDriverResponse, RequestLibResponse, RequestOptions, RequestEventHandler } from './types.js'

import { isSuccessfulResponse } from '../utils.js'
import { DEFAULTS } from '../constants.js'
import pkg from '../../package.json' with { type: 'json' }

const ERRORS_TO_EXCLUDE_FROM_RETRY = [
    'detached shadow root',
    'move target out of bounds'
]

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Connection': 'keep-alive',
    'Accept': 'application/json',
    'User-Agent': 'webdriver/' + pkg.version
}

const log = logger('webdriver')

export abstract class WebDriverRequest {
    protected abstract fetch(url: URL, opts: RequestInit): Promise<Response>

    body?: Record<string, unknown>
    method: string
    endpoint: string
    isHubCommand: boolean
    requiresSessionId: boolean
    eventHandler: RequestEventHandler

    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false, eventHandler: RequestEventHandler = {}) {
        this.body = body
        this.method = method
        this.endpoint = endpoint
        this.isHubCommand = isHubCommand
        this.requiresSessionId = Boolean(this.endpoint.match(/:sessionId/))
        this.eventHandler = eventHandler
    }

    async makeRequest (options: RequestOptions, sessionId?: string) {
        const { url, requestOptions } = await this.createOptions(options, sessionId)
        this.eventHandler.onRequest?.(requestOptions)
        return this._request(url, requestOptions, options.transformResponse, options.connectionRetryCount, 0)
    }

    async createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false): Promise<{url: URL; requestOptions: RequestInit;}> {
        const timeout = options.connectionRetryTimeout || DEFAULTS.connectionRetryTimeout.default as number
        const requestOptions: RequestInit = {
            method: this.method,
            signal: AbortSignal.timeout(timeout)
        }

        const requestHeaders: HeadersInit = new Headers({
            ...DEFAULT_HEADERS,
            ...(typeof options.headers === 'object' ? options.headers : {})
        })

        const searchParams = isBrowser ? undefined : (typeof options.queryParams === 'object' ? options.queryParams : undefined)

        /**
         * only apply body property if existing
         */
        if (this.body && (Object.keys(this.body).length || this.method === 'POST')) {
            const contentLength = Buffer.byteLength(JSON.stringify(this.body), 'utf8')
            requestOptions.body = this.body as unknown as BodyInit
            requestHeaders.set('Content-Length', `${contentLength}`)
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

        const url = new URL(`${options.protocol}://${options.hostname}:${options.port}${this.isHubCommand ? this.endpoint : `${options.path || ''}/${endpoint}`.replace(/(\/){2,}/g, '/')}`)

        if (searchParams) {
            url.search = new URLSearchParams(searchParams).toString()
        }

        /**
         * send authentication credentials only when creating new session
         */
        if (this.endpoint === '/session' && options.user && options.key) {
            requestHeaders.set('Authorization', 'Basic ' + btoa(options.user + ':' + options.key))
        }

        requestOptions.headers = requestHeaders

        return {
            url,
            requestOptions: typeof options.transformRequest === 'function'
                ? options.transformRequest(requestOptions)
                : requestOptions
        }
    }

    protected async _libRequest (url: URL, opts: RequestInit): Promise<Options.RequestLibResponse> {
        try {
            const response = await this.fetch(url, {
                method: opts.method,
                body: JSON.stringify(opts.body),
                headers: opts.headers as Record<string, string>,
                signal: opts.signal,
            })

            // Cloning the response to prevent body unusable error
            const resp = response.clone()

            return {
                statusCode: resp.status,
                body: await resp.json() ?? {},
            } as Options.RequestLibResponse
        } catch (err) {
            if (!(err instanceof Error)) {
                throw new WebDriverRequestError(
                    new Error(`Failed to fetch ${url.href}: ${(err as Error).message || err || 'Unknown error'}`),
                    url,
                    opts
                )
            }

            throw new WebDriverRequestError(err, url, opts)
        }
    }

    protected async _request (
        url: URL,
        fullRequestOptions: RequestInit,
        transformResponse?: (response: RequestLibResponse, requestOptions: RequestInit) => RequestLibResponse,
        totalRetryCount = 0,
        retryCount = 0
    ): Promise<WebDriverResponse> {
        log.info(`[${fullRequestOptions.method}] ${(url as URL).href}`)

        if (fullRequestOptions.body && Object.keys(fullRequestOptions.body).length) {
            log.info('DATA', transformCommandLogResult(fullRequestOptions.body))
        }

        const { ...requestLibOptions } = fullRequestOptions
        const startTime = performance.now()
        let response = await this._libRequest(url!, requestLibOptions)
            .catch((err: WebDriverRequestError) => err)
        const durationMillisecond = performance.now() - startTime

        /**
         * handle retries for requests
         * @param {Error} error  error object that causes the retry
         * @param {string} msg   message that is being shown as warning to user
         */
        const retry = async (error: Error) => {
            /**
             * stop retrying if totalRetryCount was exceeded or there is no reason to
             * retry, e.g. if sessionId is invalid
             */
            if (retryCount >= totalRetryCount || error.message.includes('invalid session id')) {
                log.error(error.message)
                this.eventHandler.onResponse?.({ error })
                this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: false, error, retryCount })
                throw error
            }

            if (retryCount > 0) {
                /*
                 * Exponential backoff with a minimum of 500ms and a maximum of 10_000ms.
                 */
                await sleep(Math.min(10000, 250 * Math.pow(2, retryCount)))
            }

            ++retryCount

            this.eventHandler.onRetry?.({ error, retryCount })
            this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: false, error, retryCount })
            log.warn(error.message)
            log.info(`Retrying ${retryCount}/${totalRetryCount}`)
            return this._request(url, fullRequestOptions, transformResponse, totalRetryCount, retryCount)
        }

        /**
         * handle request errors
         */
        if (response instanceof Error) {
            const resError = response as WebDriverRequestError

            /**
             * retry failed requests
             */
            if (
                (resError.code && RETRYABLE_ERROR_CODES.includes(resError.code)) ||
                (resError.statusCode && RETRYABLE_STATUS_CODES.includes(resError.statusCode))
            ) {
                return retry(resError)
            }

            /**
             * throw if request error is unknown
             */
            this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: false, error: response, retryCount })
            throw response
        }

        if (typeof transformResponse === 'function') {
            response = transformResponse(response, fullRequestOptions) as RequestLibResponse
        }

        /**
         * Resolve only if successful response
         */
        if (isSuccessfulResponse(response.statusCode, response.body)) {
            this.eventHandler.onResponse?.({ result: response.body })
            this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: true, retryCount })
            return response.body as WebDriverResponse<unknown>
        }

        const error = new WebDriverResponseError(response, url, fullRequestOptions)

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
                this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: false, error, retryCount })
                return Promise.reject(new Error('Command can only be called to a Selenium Hub'))
            }

            return { value: response.body || null }
        }

        /**
         * stop retrying as this will never be successful.
         * we will handle this at the elementErrorHandler
         */
        if (error.name === 'stale element reference') {
            log.warn('Request encountered a stale element - terminating request')
            this.eventHandler.onResponse?.({ error })
            this.eventHandler.onPerformance?.({ request: fullRequestOptions, durationMillisecond, success: false, error, retryCount })
            throw error
        }

        /**
         * some errors can be excluded from the request retry mechanism as
         * it likely does not changes anything and the error is handled within the command.
         */
        if (ERRORS_TO_EXCLUDE_FROM_RETRY.includes(error.name)) {
            throw error
        }

        return retry(error)
    }
}
