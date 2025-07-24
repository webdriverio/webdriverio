import logger from '@wdio/logger'
import type { JsonCompatible } from '@wdio/types'
import { type local, type remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

import Timer from '../Timer.js'
import { parseOverwrite, getPatternParam } from './utils.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { MockFilterOptions, RequestWithOptions, RespondWithOptions } from './types.js'
import type { WaitForOptions } from '../../types.js'

const log = logger('WebDriverInterception')

let hasSubscribedToEvents = false

type RespondBody = string | JsonCompatible | Buffer
interface Overwrite {
    overwrite?: RequestWithOptions | RespondWithOptions
    once?: boolean
    abort?: boolean
}

/**
 * Network interception class based on a WebDriver Bidi implementation.
 *
 * Note: this code is executed in Node.js and in the browser, so make sure
 *       you use primitives that work in both environments.
 */
export default class WebDriverInterception {
    #pattern: URLPattern
    #mockId: string
    #filterOptions: MockFilterOptions
    #browser: WebdriverIO.Browser

    #eventHandler: Map<string, Function[]> = new Map()
    #restored = false
    #requestOverwrites: Overwrite[] = []
    #respondOverwrites: Overwrite[] = []
    #calls: local.NetworkResponseCompletedParameters[] = []
    #responseBodies = new Map<string, remote.NetworkBytesValue>()

    constructor (
        pattern: URLPattern,
        mockId: string,
        filterOptions: MockFilterOptions,
        browser: WebdriverIO.Browser
    ) {
        this.#pattern = pattern
        this.#mockId = mockId
        this.#filterOptions = filterOptions
        this.#browser = browser

        /**
         * attach network listener to this mock
         */
        browser.on('network.beforeRequestSent', this.#handleBeforeRequestSent.bind(this))
        browser.on('network.responseStarted', this.#handleResponseStarted.bind(this))
    }

    static async initiate(
        url: string,
        filterOptions: MockFilterOptions,
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

        return new WebDriverInterception(pattern, interception.intercept, filterOptions, browser)
    }

    #emit (event: string, args: unknown) {
        if (!this.#eventHandler.has(event)) {
            return
        }

        const handlers = this.#eventHandler.get(event) || []
        for (const handler of handlers) {
            handler(args)
        }
    }

    #addEventHandler (event: string, handler: Function) {
        if (!this.#eventHandler.has(event)) {
            this.#eventHandler.set(event, [])
        }

        const handlers = this.#eventHandler.get(event)
        handlers?.push(handler)
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
         * check if request matches filter option and do nothing if not
         */
        if (!this.#matchesFilterOptions(request)) {
            return this.#browser.networkContinueRequest({
                request: request.request.request
            })
        }

        this.#emit('request', request)
        const hasRequestOverwrites = this.#requestOverwrites.length > 0
        if (hasRequestOverwrites) {
            const { overwrite, abort } = this.#requestOverwrites[0].once
                ? this.#requestOverwrites.shift() || {}
                : this.#requestOverwrites[0]

            if (abort) {
                this.#emit('fail', request.request.request)
                return this.#browser.networkFailRequest({ request: request.request.request })
            }

            this.#emit('overwrite', request)
            return this.#browser.networkContinueRequest({
                request: request.request.request,
                ...(overwrite ? parseOverwrite(overwrite, request) : {})
            })
        }

        this.#emit('continue', request.request.request)
        return this.#browser.networkContinueRequest({
            request: request.request.request
        })
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
         * continue mock if not matching filter
         */
        if (!this.#matchesFilterOptions(request)) {
            this.#emit('continue', request.request.request)
            return this.#browser.networkProvideResponse({
                request: request.request.request
            }).catch(this.#handleNetworkProvideResponseError)
        }

        /**
         * mark mock to be "called"
         */
        this.#calls.push(request)

        /**
         * continue response as mock has no respond overwrites
         */
        if (
            this.#respondOverwrites.length === 0 ||
            !this.#respondOverwrites[0].overwrite
        ) {
            this.#emit('continue', request.request.request)
            return this.#browser.networkProvideResponse({
                request: request.request.request
            }).catch(this.#handleNetworkProvideResponseError)
        }

        const { overwrite } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * continue request (possibly with overwrites)
         */
        if (overwrite) {
            this.#emit('overwrite', request)
            const responseData = parseOverwrite(overwrite, request)
            if (responseData.body) {
                this.#responseBodies.set(request.request.request, responseData.body)
            }
            return this.#browser.networkProvideResponse({
                request: request.request.request,
                ...responseData,
            }).catch(this.#handleNetworkProvideResponseError)
        }

        /**
         * continue request as is
         */
        this.#emit('continue', request.request.request)
        return this.#browser.networkProvideResponse({
            request: request.request.request
        }).catch(this.#handleNetworkProvideResponseError)
    }

    /**
     * It appears that the networkProvideResponse method may throw an "no such request" error even though the request
     * is marked as "blocked", in these cases we can safely ignore the error.
     * @param err Bidi message error
     */
    #handleNetworkProvideResponseError(err: Error) {
        if (err.message.endsWith('no such request')) {
            return
        }

        throw err
    }

    /**
     * Get the raw binary data for a mock response by request ID
     * @param {string} requestId  The ID of the request to retrieve the binary response for
     * @returns {Buffer | null}   The binary data as a Buffer, or null if no matching binary response is found
     */
    getBinaryResponse(requestId: string): Buffer | null {
        const body = this.#responseBodies.get(requestId)
        if (body?.type !== 'base64') {
            return null
        }
        if (/[^A-Za-z0-9+/=\s]/.test(body.value)) {
            log.warn(`Invalid base64 data for request ${requestId}`)
            return null
        }
        return Buffer.from(body.value, 'base64')
    }

    /**
     * Simulate a responseStarted event for testing purposes
     * @param request NetworkResponseCompletedParameters to simulate
     */
    public simulateResponseStarted(request: local.NetworkResponseCompletedParameters): void {
        try {
            this.#handleResponseStarted(request)
        } catch (e) {
            console.log('DEBUG: Error in simulateResponseStarted:', e)
            throw e
        }
    }

    public debugResponseBodies(): Map<string, remote.NetworkBytesValue> {
        return this.#responseBodies
    }

    #isRequestMatching<T extends local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters> (request: T) {
        const matches = this.#pattern && this.#pattern.test(request.request.url)
        return request.isBlocked && matches
    }

    #matchesFilterOptions<T extends local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters> (request: T) {
        let isRequestMatching = true

        if (isRequestMatching && this.#filterOptions.method) {
            isRequestMatching = typeof this.#filterOptions.method === 'function'
                ? this.#filterOptions.method(request.request.method)
                : this.#filterOptions.method.toLowerCase() === request.request.method.toLowerCase()
        }

        if (isRequestMatching && this.#filterOptions.requestHeaders) {
            isRequestMatching = typeof this.#filterOptions.requestHeaders === 'function'
                ? this.#filterOptions.requestHeaders(request.request.headers.reduce((acc, { name, value }) => {
                    acc[name] = value.type === 'string' ? value.value : Buffer.from(value.value, 'base64').toString()
                    return acc
                }, {} as Record<string, string>))
                : Object.entries(this.#filterOptions.requestHeaders).every(([key, value]) => {
                    const header = request.request.headers.find(({ name }) => name === key)
                    if (!header) {
                        return false
                    }

                    return header.value.type === 'string'
                        ? header.value.value === value
                        : Buffer.from(header.value.value, 'base64').toString() === value
                })
        }

        if (isRequestMatching && this.#filterOptions.responseHeaders && 'response' in request) {
            isRequestMatching = typeof this.#filterOptions.responseHeaders === 'function'
                ? this.#filterOptions.responseHeaders(request.response.headers.reduce((acc, { name, value }) => {
                    acc[name] = value.type === 'string' ? value.value : Buffer.from(value.value, 'base64').toString()
                    return acc
                }, {} as Record<string, string>))
                : Object.entries(this.#filterOptions.responseHeaders).every(([key, value]) => {
                    const header = request.response.headers.find(({ name }) => name === key)
                    if (!header) {
                        return false
                    }

                    return header.value.type === 'string'
                        ? header.value.value === value
                        : Buffer.from(header.value.value, 'base64').toString() === value
                })
        }

        if (isRequestMatching && this.#filterOptions.statusCode && 'response' in request) {
            isRequestMatching = typeof this.#filterOptions.statusCode === 'function'
                ? this.#filterOptions.statusCode(request.response.status)
                : this.#filterOptions.statusCode === request.response.status
        }

        return isRequestMatching
    }

    #setOverwrite = (overwriteProp: Overwrite[], { overwrite, abort, once }: Overwrite) => {
        return once
            ? [
                ...overwriteProp.filter(({ once }) => once),
                { overwrite, abort, once }
            ]
            : [{ overwrite, abort }]
    }

    /**
     * allows access to all requests made with given pattern
     */
    get calls(): local.NetworkResponseCompletedParameters[] {
        return this.#calls
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear() {
        this.#calls = []
        this.#responseBodies.clear()
        return this
    }

    /**
     * Does what `mock.clear()` does and makes removes custom request overrides
     * and response overwrites
     */
    reset() {
        this.clear()
        this.#respondOverwrites = []
        this.#requestOverwrites = []
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
        SESSION_MOCKS[handle].delete(this as WebDriverInterception)

        if (this.#mockId) {
            await this.#browser.networkRemoveIntercept({ intercept: this.#mockId })
        }

        return this
    }

    /**
     * Always use request modification for the next request done by the browser.
     * @param payload  payload to overwrite the request
     * @param once     apply overwrite only once for the next request
     * @returns        this instance to chain commands
     */
    request(overwrite: RequestWithOptions, once?: boolean) {
        this.#ensureNotRestored()
        this.#requestOverwrites = this.#setOverwrite(this.#requestOverwrites, { overwrite, once })
        return this
    }

    /**
     * alias for `mock.request(…, true)`
     */
    requestOnce(payload: RequestWithOptions) {
        return this.request(payload, true)
    }

    /**
     * Always respond with same overwrite
     * @param {*}       payload  payload to overwrite the response
     * @param {*}       params   additional respond parameters to overwrite
     * @param {boolean} once     apply overwrite only once for the next request
     * @returns                  this instance to chain commands
     */
    respond(payload: RespondBody, params: Omit<RespondWithOptions, 'body'> = {}, once?: boolean) {
        this.#ensureNotRestored()
        const body = Buffer.isBuffer(payload)
            ? { type: 'base64', value: payload.toString('base64') }
            : { type: 'string', value: typeof payload === 'string' ? payload : JSON.stringify(payload) }
        const overwrite: RespondWithOptions = { body, ...params }
        this.#respondOverwrites = this.#setOverwrite(this.#respondOverwrites, { overwrite, once })
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
        this.#requestOverwrites = this.#setOverwrite(this.#requestOverwrites, { abort: true, once })
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
        this.request(requestWith, once)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, callback: (...args: any[]) => void): WebDriverInterception {
        this.#addEventHandler(event, callback)
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
        const timer = new Timer(interval, timeout, fn, true) as unknown as Promise<boolean>

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
