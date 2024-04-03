/* eslint-disable no-dupe-class-members */
import EventEmitter from 'node:events'

import logger from '@wdio/logger'
import { type JsonCompatible } from '@wdio/types'
import { type local, type remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

import Timer from '../Timer.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { MockOptions, ErrorReason, RequestWithOptions, RespondWithOptions } from './types.js'
import type { WaitForOptions } from '../../types.js'

const log = logger('WebDriverInterception')

let hasSubscribedToEvents = false

type RespondBody = string | JsonCompatible | Buffer

/**
 * Network interception class based on a WebDriver Bidi implementation.
 *
 * Note: this code is executed in Node.js and in the browser, so make sure
 *       you use primitives that work in both environments.
 */
export default class WebDriverInterception {
    #pattern: URLPattern
    #mockId: string
    #browser: WebdriverIO.Browser

    #emitter = new EventEmitter()
    #restored = false
    #respondOverwrites: {
        overwrite?: RequestWithOptions | RespondWithOptions
        requestWith?: RequestWithOptions
        once?: boolean
        errorReason?: ErrorReason
    }[] = []
    #calls: local.NetworkResponseCompletedParameters[] = []

    private constructor (
        pattern: URLPattern,
        mockId: string,
        browser: WebdriverIO.Browser
    ) {
        this.#pattern = pattern
        this.#mockId = mockId
        this.#browser = browser

        /**
         * attach network listener to this mock
         */
        browser.on('network.beforeRequestSent', this.#handleBeforeRequestSent.bind(this))
        browser.on('network.responseStarted', this.#handleResponseStarted.bind(this))
    }

    static async initiate(
        url: string,
        /**
         * ToDo(Christian): incorporate filterOptions
         */
        filterOptions: MockOptions,
        browser: WebdriverIO.Browser
    ) {
        const pattern = parseUrlPattern(url)
        if (!hasSubscribedToEvents) {
            await browser.sessionSubscribe({
                events: [
                    'network.beforeRequestSent',
                    'network.responseStarted'
                ]
            })
            log.info('subscribed to network events')
            hasSubscribedToEvents = true
        }

        /**
         * register network intercept
         */
        const interception = await browser.networkAddIntercept({
            phases: ['beforeRequestSent', 'responseStarted'],
            urlPatterns: [{
                type: 'pattern',
                protocol: getPatternParam(pattern, 'protocol'),
                hostname: getPatternParam(pattern, 'hostname'),
                pathname: getPatternParam(pattern, 'pathname'),
                port: getPatternParam(pattern, 'port'),
                search: getPatternParam(pattern, 'search')
            }]
        })

        return new WebDriverInterception(pattern, interception.intercept, browser)
    }

    #handleBeforeRequestSent(request: local.NetworkBeforeRequestSentParameters) {
        /**
         * don't do anything if:
         * - request is not blocked
         * - request is not matching the pattern, e.g. a different mock is responsible for this request
         */
        if (!this.#isRequestMatching(request)) {
            return
        }

        /**
         * continue the request without modifications, if:
         */
        const continueRequest = (
            /**
             * - mock has no request/respond overwrites
             * - no request modifications are set
             *   - no errorReason is set
             *   - no requestWith is set
             */
            this.#respondOverwrites.length === 0 ||
            (
                !this.#respondOverwrites[0].errorReason &&
                !this.#respondOverwrites[0].requestWith
            )
        )

        /**
         * check if request matches the mock url
         */
        if (continueRequest) {
            this.#emitter.emit('continue', request.request.request)
            return this.#browser.networkContinueRequest({
                request: request.request.request
            })
        }

        this.#emitter.emit('request', request)
        const { requestWith, errorReason } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * check if should abort the request
         */
        if (errorReason) {
            this.#emitter.emit('fail', request.request.request)
            return this.#browser.networkFailRequest({ request: request.request.request })
        }

        /**
         * continue request (possibly with overwrites)
         */
        if (requestWith) {
            this.#emitter.emit('overwrite', request)
            return this.#browser.networkContinueRequest({
                request: request.request.request,
                ...parseOverwrite(requestWith, request)
            })
        }

        throw new Error('This should never happen')
    }

    #handleResponseStarted(request: local.NetworkResponseCompletedParameters) {
        /**
         * don't do anything if:
         * - request is not blocked
         * - request is not matching the pattern, e.g. a different mock is responsible for this request
         */
        if (!this.#isRequestMatching(request)) {
            return
        }

        /**
         * continue the request without modifications, if:
         */
        const continueRequest = (
            /**
             * - mock has no request/respond overwrites
             * - no request modifications are set, e.g. no overwrite is set
             */
            this.#respondOverwrites.length === 0 ||
            !this.#respondOverwrites[0].overwrite
        )

        /**
         * check if request matches the mock url
         */
        if (continueRequest) {
            this.#emitter.emit('continue', request.request.request)
            return this.#browser.networkProvideResponse({
                request: request.request.request
            })
        }

        this.#calls.push(request)
        const { overwrite } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * continue request (possibly with overwrites)
         */
        if (overwrite) {
            this.#emitter.emit('overwrite', request)
            return this.#browser.networkProvideResponse({
                request: request.request.request,
                ...parseOverwrite(overwrite, request)
            })
        }

        /**
         * continue request as is
         */
        this.#emitter.emit('continue', request.request.request)
        return this.#browser.networkProvideResponse({
            request: request.request.request
        })
    }

    #isRequestMatching (request: local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters) {
        return request.isBlocked && this.#pattern && this.#pattern.test(request.request.url)
    }

    /**
     * allows access to all requests made with given pattern
     */
    get calls() {
        return this.#calls
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear() {
        this.#calls = []
        return this
    }

    /**
     * Does what `mock.clear()` does and makes removes custom request overrides
     * and response overwrites
     */
    reset() {
        this.clear()
        this.#respondOverwrites = []
        return this
    }

    /**
     * Does everything that `mock.reset()` does, and also
     * removes any mocked return values or implementations.
     * Restored mock does not emit events and could not mock responses
     */
    async restore() {
        this.reset()
        this.#respondOverwrites = []
        this.#restored = true
        const handle = await this.#browser.getWindowHandle()

        log.trace(`Restoring mock for ${handle}`)
        SESSION_MOCKS[handle].delete(this as any)

        if (this.#mockId) {
            await this.#browser.networkRemoveIntercept({ intercept: this.#mockId })
        }

        return this
    }

    /**
     * Always respond with same overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     * @param {boolean} once  apply overwrite only once for the next request
     */
    respond(payload: RespondBody, params: Omit<RespondWithOptions, 'body'> = {}, once?: boolean) {
        this.#ensureNotRestored()
        const body = typeof payload === 'string'
            ? payload
            : globalThis.Buffer && globalThis.Buffer.isBuffer(payload)
                ? payload.toString('base64')
                : JSON.stringify(payload)
        const overwrite: RespondWithOptions = { body, ...params }
        this.#respondOverwrites.push({ overwrite, once })
        return this
    }

    /**
     * alias for `mock.respond(…, true)`
     */
    respondOnce(payload: RespondBody, params: Omit<RespondWithOptions, 'body'> = {}) {
        return this.respond(payload, params, true)
    }

    /**
     * Abort the request with an error code
     * @param {string} errorReason  error code of the response
     * @param {boolean} once        if request should be aborted only once for the next request
     */
    abort(once?: boolean) {
        this.#ensureNotRestored()
        this.#respondOverwrites.push({ errorReason: 'Aborted', once })
        return this
    }

    /**
     * alias for `mock.abort(true)`
     */
    abortOnce() {
        return this.abort(true)
    }

    /**
     * Redirect request to another URL
     * @param {string} redirectUrl  URL to redirect to
     * @param {boolean} sticky      if request should be redirected for all following requests
     */
    redirect(redirectUrl: string, once?: boolean) {
        this.#ensureNotRestored()
        const requestWith = { url: redirectUrl }
        this.#respondOverwrites.push({ requestWith, once })
        return this
    }

    /**
     * alias for `mock.redirect(…, true)`
     */
    redirectOnce(redirectUrl: string) {
        return this.redirect(redirectUrl, true)
    }

    on(event: 'request', callback: (request: local.NetworkBeforeRequestSentParameters) => void): WebDriverInterception
    on(event: 'match', callback: (match: local.NetworkBeforeRequestSentParameters) => void): WebDriverInterception
    on(event: 'continue', callback: (requestId: string) => void): WebDriverInterception
    on(event: 'fail', callback: (requestId: string) => void): WebDriverInterception
    on(event: 'overwrite', callback: (response: local.NetworkResponseCompletedParameters) => void): WebDriverInterception
    on(event: string, callback: (...args: any[]) => void): WebDriverInterception {
        this.#emitter.on(event, callback)
        return this
    }

    #ensureNotRestored() {
        if (this.#restored) {
            throw new Error('This can\'t be done on restored mock')
        }
    }

    waitForResponse ({
        timeout = this.#browser.options.waitforTimeout,
        interval = this.#browser.options.waitforInterval,
        timeoutMsg,
    }: WaitForOptions = {}) {
        /*!
         * ensure that timeout and interval are set properly
         */
        if (typeof timeout !== 'number') {
            timeout = this.#browser.options.waitforTimeout as number
        }

        if (typeof interval !== 'number') {
            interval = this.#browser.options.waitforInterval as number
        }

        /* istanbul ignore next */
        const fn = async () => this.calls && (await this.calls).length > 0
        const timer = new Timer(interval, timeout, fn, true) as any as Promise<boolean>

        return this.#browser.call(() => timer.catch((e) => {
            if (e.message === 'timeout') {
                if (typeof timeoutMsg === 'string') {
                    throw new Error(timeoutMsg)
                }
                throw new Error(`waitForResponse timed out after ${timeout}ms`)
            }

            throw new Error(`waitForResponse failed with the following reason: ${(e && e.message) || e}`)
        }))
    }
}

export function parseUrlPattern(url: string | URLPattern) {
    /**
     * return early if it's already a URLPattern
     */
    if (typeof url === 'object') {
        return url
    }

    /**
     * parse URLPattern from absolute URL
     */
    if (url.startsWith('http')) {
        return new URLPattern(url)
    }

    /**
     * parse URLPattern from relative URL
     */
    return new URLPattern({
        pathname: url
    })
}

/**
 * parse request or response overwrites to make it compatible with Bidis protocol
 * @param overwrite request or response overwrite
 * @returns object to pass to the protocol
 */
export function parseOverwrite(overwrite: RequestWithOptions | RespondWithOptions, request: local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters) {
    let body: remote.NetworkBytesValue | undefined = undefined
    if ('body' in overwrite && overwrite.body) {
        const bodyOverwrite = typeof overwrite.body === 'function'
            ? overwrite.body(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.body
        body = typeof bodyOverwrite === 'string' ?
            /**
             * if body is a string we can pass it as is
             */
            {
                type: 'string',
                value: bodyOverwrite
            }
            :
            /**
             * if body is an object we need to encode it
             */
            {
                type: 'base64',
                value: globalThis.Buffer
                    ? globalThis.Buffer.from(JSON.stringify(bodyOverwrite)).toString('base64')
                    : btoa(JSON.stringify(bodyOverwrite))
            }
    }

    let headers: remote.NetworkHeader[] = []
    if (overwrite.headers) {
        headers = Object.entries(overwrite.headers).map(([name, value]) => ({
            name,
            value: { type: 'string', value }
        }))
    }

    let cookies: remote.NetworkSetCookieHeader[] = []
    if ('cookies' in overwrite && overwrite.cookies) {
        const cookieOverwrite = typeof overwrite.cookies === 'function'
            ? overwrite.cookies(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.cookies
        cookies = cookieOverwrite.map((cookie) => ({
            name: cookie.name,
            value: <remote.NetworkStringValue>{
                type: 'string',
                value: cookie.value
            },
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expiry,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite?.toLowerCase() as remote.NetworkSetCookieHeader['sameSite'],
        }))
    }

    let statusCode: number | undefined = undefined
    if ('statusCode' in overwrite && overwrite.statusCode) {
        const statusCodeOverwrite = typeof overwrite.statusCode === 'function'
            ? overwrite.statusCode(request as local.NetworkResponseCompletedParameters)
            : overwrite.statusCode
        statusCode = statusCodeOverwrite
    }

    const method: string | undefined = 'method' in overwrite
        ? typeof overwrite.method === 'function'
            ? overwrite.method(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.method
        : undefined

    const url = 'url' in overwrite
        ? typeof overwrite.url === 'function'
            ? overwrite.url(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.url
        : undefined
    return { body, headers, cookies, method, statusCode, url }
}

function getPatternParam (pattern: URLPattern, key: keyof Omit<remote.NetworkUrlPatternPattern, 'type'>) {
    if (key !== 'pathname' && pattern[key] === '*') {
        return
    }

    if (key === 'port' && pattern.port === '') {
        return pattern.protocol === 'https' ? '443' : '80'
    }

    return pattern[key].replaceAll('*', '\\*')
}
