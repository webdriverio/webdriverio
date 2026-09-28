import logger from '@wdio/logger'
import type { JsonCompatible } from '@wdio/types'
import { type local, type remote } from 'webdriver'
import { URLPattern as URLPatternPolyfill, type URLPattern } from 'urlpattern-polyfill'

import Timer from '../Timer.js'
import { parseOverwrite, getPatternParam } from './utils.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { MockFilterOptions, RequestWithOptions, RespondWithOptions, Response } from './types.js'
import type { WaitForOptions } from '../../types.js'

const log = logger('WebDriverInterception')

const DEFAULT_SPY_COLLECTED_BODY_SIZE = 10 * 1024 * 1024

let hasSubscribedToEvents = false

type RespondBodyValue = string | JsonCompatible | Buffer
type RespondBody = RespondBodyValue | ((request: local.NetworkResponseCompletedParameters) => RespondBodyValue)
interface Overwrite {
    overwrite?: RequestWithOptions | RespondWithOptions
    once?: boolean
    abort?: boolean
}

type RequestWithPostData<T extends local.NetworkBeforeRequestSentParameters | Response> = T & {
    postData?: string
}

function toStringBody(payload: Exclude<RespondBodyValue, Buffer>) {
    if (typeof payload === 'string') {
        return payload
    }

    /**
     * `JSON.stringify` is typed as returning `string`, but at runtime it returns
     * `undefined` for values it cannot serialize (functions, symbols, undefined).
     * Fail loudly instead of silently sending an invalid BiDi body.
     */
    const serialized = JSON.stringify(payload) as string | undefined
    if (typeof serialized !== 'string') {
        throw new Error(
            `Failed to serialize mock.respond() payload of type "${typeof payload}". ` +
            'The response body must be a string, Buffer, or JSON-serializable value.'
        )
    }

    return serialized
}

/**
 * A request paused by the driver is released exactly once, however many mocks
 * intercepted it. Every mock registers its own `network.addIntercept` and its own
 * event listener, so when two mocks match the same request they both try to
 * release it and the driver rejects the second attempt with "Invalid state for
 * continueInterceptedRequest" / "Invalid InterceptionId.". Nobody awaits an event
 * handler, so that rejection escapes as an unhandled rejection.
 *
 * `mock()` already replaces a mock that has an identical definition, so the mocks
 * that still overlap are the ones whose definitions differ while their patterns
 * match the same request - two `**` mocks separated by their filter options, say.
 *
 * The listeners of one BiDi event all receive the same parameter object, so the
 * event itself carries the mark. `beforeRequestSent` and `responseStarted` are
 * separate pause points that arrive as separate objects, which is what keeps a
 * request releasable once per phase. The event also reports which intercepts
 * blocked it, so a request that only one intercept blocked takes no mark at all
 * and behaves exactly as before.
 */
const RELEASED = Symbol('wdio.interception.released')

type InterceptedEvent = { intercepts?: string[] }

/**
 * Whether more than one intercept blocked this request, i.e. whether the mocks
 * have to agree on who releases it.
 */
function isContested(event: InterceptedEvent) {
    return Boolean(event.intercepts && event.intercepts.length > 1)
}

function isClaimed(event: InterceptedEvent) {
    return Boolean((event as { [RELEASED]?: true })[RELEASED])
}

function claim(event: InterceptedEvent) {
    const claimable = event as { [RELEASED]?: true }
    if (claimable[RELEASED]) {
        return false
    }

    claimable[RELEASED] = true
    return true
}

/**
 * The browser bundle references `Buffer` as a free global. Node has it; the page
 * does not, unless a polyfill installed one. Resolve it from `globalThis` so a
 * missing binding does not throw while a component test is setting up a mock.
 */
function nodeBuffer() {
    return (globalThis as { Buffer?: typeof Buffer }).Buffer
}

function toNetworkBody(payload: RespondBodyValue) {
    const buffer = nodeBuffer()
    if (typeof buffer?.isBuffer === 'function' && buffer.isBuffer(payload)) {
        return { type: 'base64' as const, value: payload.toString('base64') }
    }

    return { type: 'string' as const, value: toStringBody(payload as Exclude<RespondBodyValue, Buffer>) }
}

/**
 * Network interception class based on a WebDriver Bidi implementation.
 *
 * Note: this code is executed in Node.js and in the browser, so make sure
 *       you use primitives that work in both environments.
 */
export default class WebDriverInterception {
    #pattern: URLPattern
    #patternId: string
    #mockId: string
    #filterOptions: MockFilterOptions
    #browser: WebdriverIO.Browser

    #eventHandler: Map<string, Function[]> = new Map()
    #restored = false
    #requestOverwrites: Overwrite[] = []
    #respondOverwrites: Overwrite[] = []
    #calls: Response[] = []
    #overwrittenResponseBodies = new Map<string, remote.NetworkBytesValue>()
    #requestPostData = new Map<string, string>()
    #isCollectingNetworkData: boolean
    #hasOneResponseCollected = false
    #blockedRequests = new Set<string>()
    #requestsRespondedWithoutFetch = new Set<string>()

    constructor(
        pattern: URLPattern,
        mockId: string,
        filterOptions: MockFilterOptions,
        browser: WebdriverIO.Browser,
        isCollectingNetworkData = false
    ) {
        this.#pattern = pattern
        this.#patternId = getPatternId(pattern)
        this.#mockId = mockId
        this.#filterOptions = filterOptions
        this.#browser = browser
        this.#isCollectingNetworkData = isCollectingNetworkData

        /**
         * attach network listener to this mock
         */
        browser.on('network.beforeRequestSent', this.#handleBeforeRequestSent.bind(this))
        browser.on('network.responseStarted', this.#handleResponseStarted.bind(this))
        browser.on('network.responseCompleted', this.#handleResponseCompleted.bind(this))
    }

    static async initiate(
        url: string | URLPattern,
        filterOptions: MockFilterOptions,
        browser: WebdriverIO.Browser
    ) {
        const pattern = parseUrlPattern(url)
        const isCollectingNetworkData = browser.options.maxSpyCollectedBodySize !== 0

        if (!hasSubscribedToEvents) {
            await browser.sessionSubscribe({
                events: [
                    'network.beforeRequestSent',
                    'network.responseStarted',
                    'network.responseCompleted'
                ]
            })
            try {
                if (isCollectingNetworkData) {
                    await browser.networkAddDataCollector({
                        dataTypes: ['request', 'response'],
                        maxEncodedDataSize: typeof browser.options.maxSpyCollectedBodySize === 'number'
                            ? browser.options.maxSpyCollectedBodySize
                            : DEFAULT_SPY_COLLECTED_BODY_SIZE
                    })
                }
            } catch (error) {
                // Log a warning instead of failing the test
                log.warn(`[BiDi] network.addDataCollector not supported: ${(error as Error)?.message}`)
            }
            log.info('subscribed to network events')
            hasSubscribedToEvents = true
        }

        /**
         * Listen before the intercept exists. A catch-all pattern pauses the
         * runner's own HTTP traffic as soon as it is installed, and those
         * requests have to be continued before `addIntercept` resolves.
         */
        const interception = new WebDriverInterception(pattern, 'pending', filterOptions, browser, isCollectingNetworkData)
        const registered = await browser.networkAddIntercept({
            phases: ['beforeRequestSent', 'responseStarted'],
            urlPatterns: toBidiUrlPatterns(pattern)
        })
        interception.#mockId = registered.intercept
        return interception
    }

    /**
     * The intercept id is not known until `network.addIntercept` resolves.
     * Requests paused in that window are released so the page can keep loading.
     */
    #releaseWhilePending(request: { isBlocked?: boolean, request: { request: string } }, phase: 'beforeRequestSent' | 'responseStarted') {
        if (this.#mockId !== 'pending' || !request.isBlocked) {
            return false
        }

        const networkCall = phase === 'beforeRequestSent'
            ? this.#browser.networkContinueRequest({ request: request.request.request })
            : this.#browser.networkProvideResponse({ request: request.request.request })
        networkCall.catch(() => { /* request may already have been released */ })
        return true
    }

    #emit(event: string, args: unknown) {
        if (!this.#eventHandler.has(event)) {
            return
        }

        const handlers = this.#eventHandler.get(event) || []
        for (const handler of handlers) {
            handler(args)
        }
    }

    #addEventHandler(event: string, handler: Function) {
        if (!this.#eventHandler.has(event)) {
            this.#eventHandler.set(event, [])
        }

        const handlers = this.#eventHandler.get(event)
        handlers?.push(handler)
    }

    /**
     * Release a paused request, unless another mock listening to the same event
     * has already released it.
     *
     * `handling` says whether this mock is the one the request belongs to. A mock
     * that only releases because the request does *not* match it must not take the
     * release away from a mock that does, and while the event is still being
     * dispatched it cannot know whether such a mock exists. So it waits for the
     * dispatch to finish - the listeners of one event run synchronously - and
     * releases only if nobody claimed the request in the meantime.
     */
    #release<T>(event: InterceptedEvent, handling: boolean, call: () => T): T | undefined {
        if (!isContested(event)) {
            return call()
        }

        if (handling) {
            return claim(event) ? call() : undefined
        }

        if (!isClaimed(event)) {
            queueMicrotask(() => {
                if (claim(event)) {
                    call()
                }
            })
        }

        return undefined
    }

    #handleBeforeRequestSent(request: local.NetworkBeforeRequestSentParameters) {
        if (this.#releaseWhilePending(request, 'beforeRequestSent')) {
            return
        }
        if (this.#restored) {
            // If restored during in-flight request, continue it to prevent hanging
            if (request.intercepts?.includes(this.#mockId)) {
                return this.#release(request, false, () => this.#browser.networkContinueRequest({
                    request: request.request.request
                }).catch(() => { /* ignore errors for restored mocks */ }))
            }
            return
        }
        /**
         * don't do anything if:
         * - request is not blocked
         * - request is not matching the pattern, e.g. a different mock is responsible for this request
         */
        if (!this.#isRequestMatching(request)) {
            /**
             * if request is not matching pattern but blocked by this mock (due to catch-all),
             * we need to continue the request
             */
            if (request.intercepts?.includes(this.#mockId)) {
                return this.#release(request, false, () => this.#browser.networkContinueRequest({
                    request: request.request.request
                }))
            }
            return
        }

        if (this.#filterOptions.postData) {
            return this.#handleBeforeRequestSentWithPostData(request)
        }

        return this.#continueBeforeRequestSent(request)
    }

    async #handleBeforeRequestSentWithPostData(request: local.NetworkBeforeRequestSentParameters) {
        await this.#populateRequestPostData(request)
        return this.#continueBeforeRequestSent(request)
    }

    #continueBeforeRequestSent(request: local.NetworkBeforeRequestSentParameters) {
        /**
         * check if request matches filter option and do nothing if not
         */
        if (!this.#matchesFilterOptions(request)) {
            return this.#release(request, false, () => this.#browser.networkContinueRequest({
                request: request.request.request
            }))
        }

        const requestId = request.request.request
        this.#emit('request', request)
        const responseOverwrite = this.#respondOverwrites[0]

        if (
            responseOverwrite?.overwrite &&
            'fetchResponse' in responseOverwrite.overwrite &&
            responseOverwrite.overwrite.fetchResponse === false
        ) {
            return this.#release(request, true, () => {
                const { overwrite } = responseOverwrite.once
                    ? this.#respondOverwrites.shift() || {}
                    : responseOverwrite

                if (!overwrite) {
                    return
                }

                this.#emit('overwrite', request)
                try {
                    const responseData = parseOverwrite(overwrite as RespondWithOptions, request)
                    if (responseData.body) {
                        this.#overwrittenResponseBodies.set(requestId, responseData.body)
                    }
                    this.#requestsRespondedWithoutFetch.add(requestId)
                    return this.#withBlockedRequestTracking(
                        requestId,
                        this.#browser.networkProvideResponse({
                            request: requestId,
                            statusCode: 200,
                            ...responseData
                        }).catch((err) => {
                            this.#requestsRespondedWithoutFetch.delete(requestId)
                            return this.#handleNetworkProvideResponseError(err)
                        })
                    )
                } catch (err) {
                    this.#requestsRespondedWithoutFetch.delete(requestId)
                    log.error(`Failed to apply mock.respond() overwrite: ${(err as Error).message}`)
                    return this.#withBlockedRequestTracking(
                        requestId,
                        this.#browser.networkFailRequest({
                            request: requestId
                        }).catch(this.#handleNetworkProvideResponseError)
                    )
                }
            })
        }

        const hasRequestOverwrites = this.#requestOverwrites.length > 0
        if (hasRequestOverwrites) {
            const { overwrite, abort } = this.#requestOverwrites[0].once
                ? this.#requestOverwrites.shift() || {}
                : this.#requestOverwrites[0]

            if (abort) {
                this.#emit('fail', requestId)
                return this.#release(request, true, () => this.#withBlockedRequestTracking(
                    requestId,
                    this.#browser.networkFailRequest({ request: requestId })
                ))
            }

            this.#emit('overwrite', request)
            return this.#release(request, true, () => this.#withBlockedRequestTracking(
                requestId,
                this.#browser.networkContinueRequest({
                    request: requestId,
                    ...(overwrite ? parseOverwrite(overwrite, request) : {})
                })
            ))
        }

        this.#emit('continue', requestId)
        return this.#release(request, true, () => this.#withBlockedRequestTracking(
            requestId,
            this.#browser.networkContinueRequest({
                request: requestId
            })
        ))
    }

    #handleResponseStarted(request: Response) {
        if (this.#releaseWhilePending(request, 'responseStarted')) {
            return
        }
        if (this.#restored) {
            // If restored during in-flight request, provide response to prevent hanging
            if (request.intercepts?.includes(this.#mockId)) {
                return this.#release(request, false, () => this.#browser.networkProvideResponse({
                    request: request.request.request
                }).catch(() => { /* ignore errors for restored mocks */ }))
            }
            return
        }
        /**
         * don't do anything if the request does not match the pattern, e.g. a
         * different mock is responsible for this request
         */
        const isHandledByThisMock = request.intercepts?.includes(this.#mockId)
        const urlMatches = this.#urlMatches(request.request.url)
        if (!urlMatches) {
            /**
             * if request is not matching pattern but blocked by this mock (due to catch-all),
             * we need to continue the request
             */
            if (isHandledByThisMock && request.isBlocked) {
                return this.#release(request, false, () => this.#browser.networkProvideResponse({
                    request: request.request.request
                }).catch(this.#handleNetworkProvideResponseError))
            }
            return
        }

        this.#attachPostData(request)

        const filterMatches = this.#matchesFilterOptions(request)
        if (filterMatches) {
            /**
             * record matching requests even when the driver did not mark them as "blocked"
             * (e.g. subresources loaded while navigating) so `calls`/`waitForResponse()`
             * resolve correctly
             */
            this.#calls.push(request)
        }

        /**
         * A response provided during `beforeRequestSent` still causes Chrome to
         * emit `responseStarted`, but there is no longer a paused request to
         * release at this phase.
         */
        if (this.#requestsRespondedWithoutFetch.delete(request.request.request)) {
            return this.#release(request, true, () => undefined)
        }

        /**
         * only requests the driver paused ("blocked") need to be continued or
         * provided a response; non-blocked requests are not paused, so calling
         * `networkProvideResponse` on them fails at the protocol layer
         */
        if (!request.isBlocked) {
            return
        }

        /**
         * continue mock if not matching filter
         */
        if (!filterMatches) {
            this.#emit('continue', request.request.request)
            return this.#release(request, false, () => this.#browser.networkProvideResponse({
                request: request.request.request
            }).catch(this.#handleNetworkProvideResponseError))
        }

        const requestId = request.request.request

        /**
         * continue response as mock has no respond overwrites
         */
        if (
            this.#respondOverwrites.length === 0 ||
            !this.#respondOverwrites[0].overwrite
        ) {
            this.#emit('continue', requestId)
            return this.#release(request, true, () => this.#withBlockedRequestTracking(
                requestId,
                this.#browser.networkProvideResponse({
                    request: requestId
                }).catch(this.#handleNetworkProvideResponseError)
            ))
        }

        const { overwrite } = this.#respondOverwrites[0].once
            ? this.#respondOverwrites.shift() || {}
            : this.#respondOverwrites[0]

        /**
         * continue request (possibly with overwrites)
         */
        if (overwrite) {
            this.#emit('overwrite', request)
            try {
                const responseData = parseOverwrite(overwrite, request)
                if (responseData.body) {
                    this.#overwrittenResponseBodies.set(requestId, responseData.body)
                }
                return this.#release(request, true, () => this.#withBlockedRequestTracking(
                    requestId,
                    this.#browser.networkProvideResponse({
                        request: requestId,
                        ...responseData,
                    }).catch(this.#handleNetworkProvideResponseError)
                ))
            } catch (err) {
                /**
                 * BiDi event dispatch swallows listener exceptions, which would leave the
                 * intercepted request blocked and hang the browser. Fail the request so the
                 * mock error is visible instead of stalling the test.
                 */
                log.error(`Failed to apply mock.respond() overwrite: ${(err as Error).message}`)
                return this.#release(request, true, () => this.#withBlockedRequestTracking(
                    requestId,
                    this.#browser.networkFailRequest({
                        request: requestId
                    }).catch(this.#handleNetworkProvideResponseError)
                ))
            }
        }

        /**
         * continue request as is
         */
        this.#emit('continue', requestId)
        return this.#release(request, true, () => this.#withBlockedRequestTracking(
            requestId,
            this.#browser.networkProvideResponse({
                request: requestId
            }).catch(this.#handleNetworkProvideResponseError)
        ))
    }

    async #handleResponseCompleted(response: Response) {
        /**
         * don't do anything if:
         * - request is not matching the pattern
         * - data collection is disabled
         */
        if (
            this.#browser.options.maxSpyCollectedBodySize === 0 ||
            !this.#urlMatches(response.request.url) ||
            !this.#matchesFilterOptions(response, { includePostData: false })
        ) {
            return
        }

        const requestWithPostData = await this.#populateRequestPostData(response)
        if (!this.#matchesPostDataFilter(requestWithPostData)) {
            this.#requestPostData.delete(response.request.request)
            return
        }

        const call = this.#getCall(response.request.request)
        if (!call) {
            return
        }

        this.#attachPostData(call)

        /**
         * try populate response body
         */
        try {
            const { bytes } = await this.#browser.networkGetData({
                request: response.request.request,
                dataType: 'response'
            })

            if (bytes) {
                call.body = bytes.value
            }
        } catch (err: unknown) {
            log.debug(`Failed to get response body for ${response.request.request}: ${(err as Error).message}`)
        } finally {
            this.#hasOneResponseCollected = true
            this.#requestPostData.delete(response.request.request)
        }
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
        const body = this.#overwrittenResponseBodies.get(requestId)
        if (body?.type !== 'base64') {
            return null
        }
        if (/[^A-Za-z0-9+/=\s]/.test(body.value)) {
            log.warn(`Invalid base64 data for request ${requestId}`)
            return null
        }
        const buffer = nodeBuffer()
        if (!buffer) {
            return null
        }
        return buffer.from(body.value, 'base64')
    }

    #attachPostData<T extends local.NetworkBeforeRequestSentParameters | Response>(request: T): RequestWithPostData<T> {
        const requestWithPostData = request as RequestWithPostData<T>
        const postData = this.#requestPostData.get(request.request.request)
        if (postData !== undefined) {
            requestWithPostData.postData = postData
        }
        return requestWithPostData
    }

    async #populateRequestPostData<T extends local.NetworkBeforeRequestSentParameters | Response>(request: T): Promise<RequestWithPostData<T>> {
        const requestWithPostData = this.#attachPostData(request)
        /**
         * Chrome rejects `network.getData` for an empty request body with
         * "No post data available for the request". A getData command in that
         * state overlaps the next intercepted request, and Chrome then never
         * answers `network.continueRequest`, so the page fetch never settles.
         */
        const bodySize = request.request.bodySize
        if (
            requestWithPostData.postData !== undefined ||
            this.#browser.options.maxSpyCollectedBodySize === 0 ||
            bodySize === 0 ||
            bodySize === null
        ) {
            return requestWithPostData
        }

        try {
            const { bytes } = await this.#browser.networkGetData({
                request: request.request.request,
                dataType: 'request'
            })

            if (bytes) {
                requestWithPostData.postData = bytes.value
                this.#requestPostData.set(request.request.request, bytes.value)
            }
        } catch (err: unknown) {
            log.debug(`Failed to get request body for ${request.request.request}: ${(err as Error).message}`)
        }

        return requestWithPostData
    }

    /**
     * Simulate a responseStarted event for testing purposes
     * @param request NetworkResponseCompletedParameters to simulate
     */
    public simulateResponseStarted(request: Response): void {
        try {
            this.#handleResponseStarted(request)
        } catch (e) {
            console.log('DEBUG: Error in simulateResponseStarted:', e)
            throw e
        }
    }

    public debugResponseBodies(): Map<string, remote.NetworkBytesValue> {
        return this.#overwrittenResponseBodies
    }

    #getCall(requestId: string) {
        for (let index = this.#calls.length - 1; index >= 0; index--) {
            const call = this.#calls[index]
            if (call.request.request === requestId) {
                return call
            }
        }
    }

    #isRequestMatching<T extends local.NetworkBeforeRequestSentParameters | Response>(request: T) {
        return request.isBlocked && this.#urlMatches(request.request.url)
    }

    /**
     * `urlpattern-polyfill` compiles a leading `**` to nested `(?:.*)*`. Testing
     * that expression against a long non-match (Vite's `/@fs/...` URLs) blocks
     * the page thread, and a catch-all intercept delivers exactly those URLs.
     * A pure glob's literals are a necessary condition, so they can reject a
     * URL before the polyfill runs. A slash directly in front of `**` is not
     * required: a final double-wildcard may match an empty suffix.
     */
    #urlMatches(url: string) {
        if (!this.#pattern) {
            return false
        }

        if (globRulesOut(this.#pattern.pathname, url)) {
            return false
        }

        return this.#pattern.test(url)
    }

    #matchesPostDataFilter<T extends local.NetworkBeforeRequestSentParameters | Response>(request: RequestWithPostData<T>) {
        if (!this.#filterOptions.postData) {
            return true
        }

        return typeof this.#filterOptions.postData === 'function'
            ? this.#filterOptions.postData(request.postData)
            : request.postData === this.#filterOptions.postData
    }

    #matchesFilterOptions<T extends local.NetworkBeforeRequestSentParameters | Response>(
        request: T,
        { includePostData = true }: { includePostData?: boolean } = {}
    ) {
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

        if (isRequestMatching && includePostData) {
            isRequestMatching = this.#matchesPostDataFilter(request as RequestWithPostData<T>)
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
    get calls(): Response[] {
        return this.#calls
    }

    get hasAtLeastOneResponseReceived(): boolean {
        const isResponseReceived = this.calls && this.calls.length > 0
        return isResponseReceived && (!this.#isCollectingNetworkData || this.#hasOneResponseCollected)
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear() {
        this.#calls = []
        this.#overwrittenResponseBodies.clear()
        this.#requestPostData.clear()
        this.#hasOneResponseCollected = false
        this.#blockedRequests.clear()
        this.#requestsRespondedWithoutFetch.clear()
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
        /**
         * Snapshot before reset()/clear() — those clear `#blockedRequests`, and we
         * still need to continue any in-flight blocked requests after cleanup.
         */
        const blockedRequestIds = Array.from(this.#blockedRequests)
        this.reset()
        this.#respondOverwrites = []
        const handle = await this.#browser.getWindowHandle()

        log.trace(`Restoring mock for ${handle}`)
        SESSION_MOCKS[handle].delete(this as WebDriverInterception)

        // Continue any in-flight blocked requests before removing the intercept
        // to prevent them from hanging
        for (const requestId of blockedRequestIds) {
            try {
                await this.#browser.networkContinueRequest({ request: requestId })
            } catch (err) {
                // Ignore errors - request may have already completed or timed out
                log.trace(`Failed to continue in-flight request ${requestId} during restore:`, err)
            }
        }
        this.#blockedRequests.clear()

        // Remove the network intercept BEFORE setting #restored flag
        // This prevents new requests from being blocked while we're cleaning up
        if (this.#mockId && this.#mockId !== 'pending') {
            await this.#browser.networkRemoveIntercept({ intercept: this.#mockId })
        }

        // Now it's safe to mark as restored
        this.#restored = true

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
        const body = typeof payload === 'function'
            ? (request: local.NetworkResponseCompletedParameters) => toNetworkBody(payload(request))
            : toNetworkBody(payload)
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
    on(event: 'overwrite', callback: (response: Response) => void): WebDriverInterception
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

    /**
     * Keep the request id tracked until the BiDi call settles so restore()
     * can still continue it if cleanup races an in-flight interception.
     */
    #withBlockedRequestTracking(requestId: string, networkCall: Promise<unknown>) {
        this.#blockedRequests.add(requestId)
        return Promise.resolve(networkCall).finally(() => {
            this.#blockedRequests.delete(requestId)
        })
    }

    isSameDefinition(url: string | URLPattern, filterOptions: MockFilterOptions = {}) {
        const pattern = parseUrlPattern(url)
        return this.#patternId === getPatternId(pattern) && areFilterOptionsEqual(this.#filterOptions, filterOptions)
    }

    waitForResponse({
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

        const isResponseReceived = () => this.hasAtLeastOneResponseReceived
        const timer = new Timer(interval, timeout, isResponseReceived, true)

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

/**
 * A pure glob's literals are a necessary condition for a match. Rejecting on
 * them avoids `pattern.test()` for long non-matches such as Vite `/@fs/...`
 * URLs. The polyfill compiles a leading `**` to nested `(?:.*)*`, and testing
 * that expression blocks the page thread. A slash directly in front of `**`
 * is not required: a final double-wildcard may match an empty suffix.
 */
function globRulesOut(pathnamePattern: string, url: string) {
    if (!pathnamePattern.includes('**') || /[:(){}+?\\]/.test(pathnamePattern)) {
        return false
    }

    let pathname: string
    try {
        pathname = new URL(url).pathname
    } catch {
        return false
    }

    const literals = pathnamePattern.split(/\*+/).filter((part) => part.length > 0)
    return literals.some((literal) => {
        if (pathname.includes(literal)) {
            return false
        }

        const withoutTrailingSlash = literal.endsWith('/') ? literal.slice(0, -1) : literal
        return withoutTrailingSlash.length === 0 || !pathname.includes(withoutTrailingSlash)
    })
}

function toBidiUrlPatterns(pattern: URLPattern): remote.NetworkUrlPatternPattern[] {
    const shared = {
        hostname: getPatternParam(pattern, 'hostname'),
        pathname: getPatternParam(pattern, 'pathname'),
        port: getPatternParam(pattern, 'port'),
        search: getPatternParam(pattern, 'search')
    }
    const protocol = getPatternParam(pattern, 'protocol')
    /**
     * An omitted protocol matches every scheme, including the `ws` connection
     * the browser runner uses to talk to the driver. Pausing that socket
     * deadlocks `browser.mock()`. Limit a wildcard protocol to http(s).
     */
    const protocols = protocol ? [protocol] : ['http', 'https']
    return protocols.map((scheme) => ({
        type: 'pattern' as const,
        protocol: scheme,
        ...shared
    }))
}

/**
 * The polyfill assigns itself to `globalThis.URLPattern` only when the
 * platform has none. Prefer the native matcher when the two differ so the
 * browser uses a linear match and Node keeps the polyfill.
 */
function createURLPattern(init: string | { pathname: string }): URLPattern {
    const NativeURLPattern = (globalThis as { URLPattern?: unknown }).URLPattern
    if (typeof NativeURLPattern === 'function' && NativeURLPattern !== URLPatternPolyfill) {
        return new (NativeURLPattern as new (pattern: string | { pathname: string }) => URLPattern)(init)
    }

    return createLinearPolyfillPattern(init)
}

/**
 * The polyfill compiles a leading `**` to `(?:.*)*`, which backtracks forever
 * on a long non-match. Rewrite that group to a linear `.*` while the pattern
 * is constructed. Native `URLPattern` does not go through this path.
 */
function createLinearPolyfillPattern(init: string | { pathname: string }): URLPattern {
    const OriginalRegExp = globalThis.RegExp
    function LinearRegExp(pattern: string | RegExp, flags?: string) {
        const source = typeof pattern === 'string' ? pattern : pattern.source
        return new OriginalRegExp(source.replaceAll('(?:.*)*', '.*'), flags)
    }
    Object.setPrototypeOf(LinearRegExp, OriginalRegExp)
    LinearRegExp.prototype = OriginalRegExp.prototype
    globalThis.RegExp = LinearRegExp as unknown as typeof RegExp
    try {
        return new URLPatternPolyfill(init)
    } finally {
        globalThis.RegExp = OriginalRegExp
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
        return createURLPattern(url)
    }

    /**
     * parse URLPattern from relative URL
     */
    return createURLPattern({
        pathname: url
    })
}

function getPatternId(pattern: URLPattern) {
    return `${pattern.protocol}|${pattern.username}|${pattern.password}|${pattern.hostname}|${pattern.port}|${pattern.pathname}|${pattern.search}|${pattern.hash}`
}

function areFilterOptionsEqual(a: MockFilterOptions = {}, b: MockFilterOptions = {}) {
    const keys: (keyof MockFilterOptions)[] = ['method', 'requestHeaders', 'responseHeaders', 'statusCode', 'postData']
    return keys.every((key) => isFilterOptionValueEqual(a[key], b[key]))
}

function isFilterOptionValueEqual(a: unknown, b: unknown) {
    if (a === b) {
        return true
    }

    if (typeof a === 'function' || typeof b === 'function') {
        return false
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a as Record<string, unknown>).sort()
        const bKeys = Object.keys(b as Record<string, unknown>).sort()
        if (aKeys.length !== bKeys.length) {
            return false
        }
        return aKeys.every((k, i) => k === bKeys[i] && (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k])
    }

    return false
}
