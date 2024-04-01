/* eslint-disable no-dupe-class-members */
import logger from '@wdio/logger'
import { type local, type remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

import { WebDriverInterception as Interception } from './index.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { ErrorReason, RequestWithOptions, RespondWithOptions } from './types.js'

const log = logger('WebDriverInterception')

let hasSubscribedToEvents = false

/**
 * Network interception class based on a WebDriver Bidi implementation.
 */
export default class WebDriverInterception extends Interception {
    #mockId?: string
    #restored = false
    #pattern?: URLPattern
    #respondOverwrites: {
        overwrite?: RequestWithOptions | RespondWithOptions
        requestWith?: RequestWithOptions
        once?: boolean
        errorReason?: ErrorReason
    }[] = []
    #calls: local.NetworkResponseCompletedParameters[] = []

    async init() {
        if (this.url instanceof RegExp) {
            throw new Error('Regular Expressions as mock url are not supported')
        }

        if (!hasSubscribedToEvents) {
            await this.browser.sessionSubscribe({
                events: [
                    'network.beforeRequestSent',
                    'network.responseCompleted'
                ]
            })
            log.info('subscribed to network events')
            hasSubscribedToEvents = true
        }

        /**
         * register network intercept
         */
        this.#pattern = parseUrlPattern(this.url)
        const interception = await this.browser.networkAddIntercept({
            phases: ['beforeRequestSent', 'responseStarted'],
            urlPatterns: [{
                type: 'pattern',
                protocol: this.#pattern.protocol,
                hostname: this.#pattern.hostname,
                pathname: this.#pattern.pathname,
                port: this.#pattern.port,
                search: this.#pattern.search,
            }]
        })
        this.#mockId = interception.intercept

        /**
         * attach network listener to this mock
         */
        this.browser.on('network.beforeRequestSent', this.#handleBeforeRequestSent.bind(this))
        this.browser.on('network.responseCompleted', this.#handleResponseCompleted.bind(this))
    }

    #handleBeforeRequestSent(request: local.NetworkBeforeRequestSentParameters) {
        /**
         * check if request matches the mock url
         */
        if (!request.isBlocked) {
            return
        }

        /**
         * check if request matches the mock url
         */
        if (!this.#pattern || !this.#pattern.test(request.request.url)) {
            return
        }

        this.emitter.emit('request', request)
        const { requestWith, errorReason } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * check if should abort the request
         */
        if (errorReason) {
            this.emitter.emit('fail', request.request.request)
            return this.browser.networkFailRequest({ request: request.request.request })
        }

        /**
         * continue request (possibly with overwrites)
         */
        if (requestWith) {
            this.emitter.emit('overwrite', request)
            return this.browser.networkContinueRequest({
                request: request.request.request,
                ...parseOverwrite(requestWith, request)
            })
        }

        /**
         * continue request as is
         */
        this.emitter.emit('continue', request.request.request)
        return this.browser.networkContinueRequest({
            request: request.request.request,
        })
    }

    #handleResponseCompleted(request: local.NetworkResponseCompletedParameters) {
        /**
         * check if request matches the mock url
         */
        if (!request.isBlocked) {
            return
        }

        /**
         * check if request matches the mock url
         */
        if (!this.#pattern || !this.#pattern.test(request.request.url)) {
            return
        }

        this.#calls.push(request)

        const { overwrite } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * continue request (possibly with overwrites)
         */
        if (overwrite) {
            this.emitter.emit('overwrite', request)
            return this.browser.networkContinueRequest({
                request: request.request.request,
                ...parseOverwrite(overwrite, request)
            })
        }

        /**
         * continue request as is
         */
        this.emitter.emit('continue', request.request.request)
        return this.browser.networkContinueRequest({
            request: request.request.request
        })
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
    }

    /**
     * Does what `mock.clear()` does and makes removes custom request overrides
     * and response overwrites
     */
    reset() {
        this.clear()
        this.#respondOverwrites = []
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
        const handle = await this.browser.getWindowHandle()

        log.trace(`Restoring mock for ${handle}`)
        SESSION_MOCKS[handle].delete(this)

        if (this.#mockId) {
            await this.browser.networkRemoveIntercept({ intercept: this.#mockId })
        }
    }

    /**
     * Always respond with same overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     * @param {boolean} once  apply overwrite only once for the next request
     */
    respond(body: RespondWithOptions['body'], params: Omit<RespondWithOptions, 'body'> = {}, once?: boolean) {
        this.#ensureNotRestored()
        const overwrite: RespondWithOptions = { body, ...params }
        this.#respondOverwrites.push({ overwrite, once })
        return this
    }

    /**
     * alias for `mock.respond(…, true)`
     */
    respondOnce(body: RespondWithOptions['body'], params: Omit<RespondWithOptions, 'body'> = {}) {
        return this.respond(body, params, false)
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
        return this.abort(false)
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
        return this.redirect(redirectUrl, false)
    }

    on(event: 'request', callback: (request: local.NetworkBeforeRequestSentParameters) => void): WebDriverInterception
    on(event: 'match', callback: (match: local.NetworkBeforeRequestSentParameters) => void): WebDriverInterception
    on(event: 'continue', callback: (requestId: string) => void): WebDriverInterception
    on(event: 'fail', callback: (requestId: string) => void): WebDriverInterception
    on(event: 'overwrite', callback: (response: local.NetworkResponseCompletedParameters) => void): WebDriverInterception
    on(event: string, callback: (...args: any[]) => void): WebDriverInterception {
        this.emitter.on(event, callback)
        return this
    }

    #ensureNotRestored() {
        if (this.#restored) {
            throw new Error('This can\'t be done on restored mock')
        }
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
                value: Buffer.from(JSON.stringify(bodyOverwrite)).toString('base64')
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
    return { body, headers, cookies, method, statusCode }
}
