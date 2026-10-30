import logger from '@wdio/logger'
import type { JsonCompatible } from '@wdio/types'
import { setWdioKind } from '@wdio/utils'
import { type local, type remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

import Timer from '../Timer.js'
import { encodeBase64, decodeBase64 } from '../base64.js'
import { parseOverwrite, getPatternParam } from './utils.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { MockFilterOptions, RequestWithOptions, RespondWithOptions, Response } from './types.js'
import type { WaitForOptions } from '../../types.js'
import { logBackgroundError } from '../sessionEnded.js'
import { arbiterOf, type Candidate, type Decision, type NetworkEvent, type Phase } from './arbiter.js'

const log = logger('WebDriverInterception')

const DEFAULT_SPY_COLLECTED_BODY_SIZE = 10 * 1024 * 1024

/**
 * the session id that each browser subscribed to the network events and added a data
 * collector for. Each session needs its own: a second session in the same process, a
 * new session after `reloadSession()` and each multi-remote instance. A WeakMap keeps
 * one entry per browser object, so ended sessions are not retained.
 */
const subscribedSessions = new WeakMap<WebdriverIO.Browser, string | undefined>()

let registeredMocks = 0

// requests can end before their response (a failed request), so the abort hand-overs are capped
const MAX_ABORT_HAND_OVERS = 1000

type RespondBodyValue = string | JsonCompatible | ArrayBufferView | ArrayBuffer
type RespondBody = RespondBodyValue | ((request: local.NetworkResponseCompletedParameters) => RespondBodyValue)
interface Overwrite {
    overwrite?: RequestWithOptions | RespondWithOptions
    once?: boolean
    abort?: boolean
}

type RequestWithPostData<T extends local.NetworkBeforeRequestSentParameters | Response> = T & {
    postData?: string
}

function toStringBody(payload: unknown) {
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
            'The response body must be a string, ArrayBufferView, ArrayBuffer, or JSON-serializable value.'
        )
    }

    return serialized
}

function decodeHeader(value: local.NetworkBytesValue) {
    return value.type === 'string'
        ? value.value
        : UTF8_DECODER.decode(decodeBase64(value.value))
}

const getArrayBufferByteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')!.get!
const UTF8_DECODER = new TextDecoder('utf-8', { ignoreBOM: true })

function isArrayBuffer(value: unknown): value is ArrayBuffer {
    try {
        getArrayBufferByteLength.call(value)
        return true
    } catch {
        // The native getter rejects non-ArrayBuffers across realms without consulting Symbol.species.
        return false
    }
}

function toNetworkBody(payload: RespondBodyValue): remote.NetworkBytesValue {
    if (ArrayBuffer.isView(payload)) {
        const bytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
        return { type: 'base64', value: encodeBase64(bytes) }
    }
    if (isArrayBuffer(payload)) {
        return { type: 'base64', value: encodeBase64(new Uint8Array(payload)) }
    }

    return { type: 'string', value: toStringBody(payload) }
}

/**
 * Network interception class based on a WebDriver Bidi implementation.
 *
 * Note: this code is executed in Node.js and in the browser, so make sure
 *       you use primitives that work in both environments.
 */
export default class WebDriverInterception {
    /**
     * What the arbiter of the browser sees of this mock, kept off the public `Mock` type
     */
    #candidate: Candidate
    #pattern: URLPattern
    #patternId: string
    #mockId: string
    /**
     * The `SESSION_MOCKS` key `mock()` stored this interception under
     */
    #sessionKey?: string
    /**
     * Restores a mock of a held context when that context closes
     */
    #onContextDestroyed?: (params: { context: string }) => void
    #warnedAboutEarlyAnswer = false
    #warnedAboutLostResponse = false
    #filterOptions: MockFilterOptions
    #browser: WebdriverIO.Browser
    #contexts?: string[]
    /**
     * The window of the parallel test that created this mock
     */
    #test?: string
    /**
     * Iframes below an owned context. Their non-blocked events carry the iframe's
     * id, so ownership can't be read off `#contexts` alone.
     */
    #descendantContexts = new Set<string>()
    #onContextCreated?: (params: { context: string, parent?: string | null }) => void

    #eventHandler: Map<string, Function[]> = new Map()
    #restored = false
    #restorePromise?: Promise<this>
    #requestOverwrites: Overwrite[] = []
    #respondOverwrites: Overwrite[] = []
    #calls: Response[] = []
    #overwrittenResponseBodies = new Map<string, remote.NetworkBytesValue>()
    #requestPostData = new Map<string, string>()
    #isCollectingNetworkData: boolean
    #hasOneResponseCollected = false
    #hasOneBodyReadStarted = false
    #blockedRequests = new Set<string>()
    #observedResponse?: { event: Response, matches: boolean }
    /**
     * Requests whose abort gave way before they were sent to a mock that needs the response
     */
    #abortsHandedOver = new Set<string>()

    constructor(
        pattern: URLPattern,
        mockId: string,
        filterOptions: MockFilterOptions,
        browser: WebdriverIO.Browser,
        isCollectingNetworkData = false,
        sessionKey?: string,
        contexts?: string[]
    ) {
        this.#sessionKey = sessionKey
        this.#pattern = pattern
        this.#patternId = getPatternId(pattern)
        this.#mockId = mockId
        this.#candidate = {
            age: ++registeredMocks,
            interceptId: mockId,
            observe: (phase, event) => this.#observe(phase, event),
            decide: (phase, event) => this.#decide(phase, event)
        }
        this.#filterOptions = filterOptions
        this.#browser = browser
        this.#contexts = contexts
        this.#isCollectingNetworkData = isCollectingNetworkData

        // the arbiter handles the blocked phases, this mock records the completed responses
        browser.on('network.responseCompleted', this.#handleResponseCompleted.bind(this))

        /**
         * A mock of a held context ends with it. Chromium keeps an intercept
         * whose only context is gone and then matches it for every context,
         * which would block requests of the other tabs.
         */
        if (contexts?.length) {
            this.#onContextDestroyed = ({ context }) => {
                this.#descendantContexts.delete(context)
                if (contexts.includes(context)) {
                    this.restore().catch(() => { /* the intercept may already be gone */ })
                }
            }
            browser.on('browsingContext.contextDestroyed', this.#onContextDestroyed)

            this.#onContextCreated = ({ context, parent }) => {
                if (parent && this.#isOwnedContext(parent)) {
                    this.#descendantContexts.add(context)
                }
            }
            browser.on('browsingContext.contextCreated', this.#onContextCreated)
        }
    }

    static async initiate(
        url: string | URLPattern | globalThis.URLPattern,
        filterOptions: MockFilterOptions,
        browser: WebdriverIO.Browser,
        scope: { contexts?: string[], sessionKey?: string, test?: string } = {}
    ) {
        const pattern = parseUrlPattern(url)
        const isCollectingNetworkData = browser.options.maxSpyCollectedBodySize !== 0

        if (!subscribedSessions.has(browser) || subscribedSessions.get(browser) !== browser.sessionId) {
            await browser.sessionSubscribe({
                events: [
                    'network.beforeRequestSent',
                    'network.responseStarted',
                    'network.responseCompleted',
                    'network.fetchError',
                    'browsingContext.contextCreated'
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
            subscribedSessions.set(browser, browser.sessionId)
        }

        /**
         * register network intercept
         */
        const interception = await browser.networkAddIntercept({
            ...(scope.contexts ? { contexts: scope.contexts } : {}),
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

        const mock = new WebDriverInterception(pattern, interception.intercept, filterOptions, browser, isCollectingNetworkData, scope.sessionKey, scope.contexts)
        mock.#test = scope.test
        // before any await: a request blocked by the new intercept must find its mock
        arbiterOf(browser).add(mock.#candidate)
        await mock.#seedDescendantContexts()
        return mock
    }

    /**
     * `contextCreated` only reports iframes created after the mock, so iframes
     * already below a held context are read from the tree.
     */
    async #seedDescendantContexts() {
        for (const root of this.#contexts ?? []) {
            try {
                const { contexts } = await this.#browser.browsingContextGetTree({ root })
                const pending = contexts.flatMap(({ children }) => children ?? [])
                for (let info = pending.pop(); info; info = pending.pop()) {
                    this.#descendantContexts.add(info.context)
                    pending.push(...(info.children ?? []))
                }
            } catch (err: unknown) {
                log.warn(`Mock may miss requests of iframes that already exist: failed to read the context tree of ${root}: ${(err as Error).message}`)
            }
        }
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

    #observe(phase: Phase, event: NetworkEvent) {
        if (phase !== 'responseStarted') {
            return
        }
        const response = event as unknown as Response
        if (!this.#isOwnEvent(response) || !this.#pattern.test(response.request.url)) {
            return
        }

        this.#attachPostData(response)
        const matches = this.#matchesFilterOptions(response)
        // #decide() reuses it, so a function filter runs once per event
        this.#observedResponse = { event: response, matches }
        // also records requests the driver did not block, e.g. subresources of a navigation
        if (matches) {
            this.#calls.push(response)
        }
    }

    #decide(phase: Phase, event: NetworkEvent): Decision | undefined | Promise<Decision | undefined> {
        if (!this.#pattern.test(event.request.url)) {
            return undefined
        }
        if (phase === 'responseStarted') {
            return this.#decideResponse(event as unknown as Response)
        }

        const request = event as local.NetworkBeforeRequestSentParameters
        if (!this.#filterOptions.postData) {
            return this.#decideRequest(request, this.#matchesFilterOptions(request))
        }
        // a miss on method or headers needs no body read
        if (!this.#matchesFilterOptions(request, { includePostData: false })) {
            return undefined
        }
        // the cheaper filters ran already: a function filter must not run twice
        return this.#populateRequestPostData(request)
            .then((withPostData) => this.#decideRequest(request, this.#matchesPostDataFilter(withPostData)))
    }

    #decideRequest(request: local.NetworkBeforeRequestSentParameters, matches: boolean) {
        this.#abortsHandedOver.delete(request.request.request)
        if (!matches) {
            return undefined
        }

        this.#emit('request', request)
        if (this.#requestOverwrites[0]?.abort) {
            return this.#decision('beforeRequestSent', request, 'answer')
        }
        if (this.#answersEarly()) {
            return this.#decision('beforeRequestSent', request, 'answer')
        }
        if (this.#requestOverwrites.length > 0) {
            return this.#decision('beforeRequestSent', request, 'answer')
        }
        if (!this.#respondOverwrites[0]?.overwrite) {
            return this.#decision('beforeRequestSent', request, 'pass')
        }
        // Firefox takes no body once the request was sent, so a mock that acts before must win
        return this.#browser.isFirefox
            ? this.#decision('beforeRequestSent', request, 'pass', { needsResponse: true })
            : this.#decision('beforeRequestSent', request, 'defer')
    }

    #decideResponse(response: Response) {
        const handedOver = this.#abortsHandedOver.delete(response.request.request)
        const observed = this.#observedResponse
        this.#observedResponse = undefined
        const matches = observed?.event === response ? observed.matches : this.#matchesFilterOptions(response)
        if (!matches) {
            this.#emit('continue', response.request.request)
            return undefined
        }

        // an abort acts here only when it gave way before the request was sent to a mock that needs the response
        const aborts = handedOver && Boolean(this.#requestOverwrites[0]?.abort)
        const answers = aborts || Boolean(this.#respondOverwrites[0]?.overwrite)
        return this.#decision('responseStarted', response, answers ? 'answer' : 'pass', { aborts })
    }

    #decision(
        phase: Phase,
        event: local.NetworkBeforeRequestSentParameters | Response,
        kind: Decision['kind'],
        { aborts = false, needsResponse = false } = {}
    ): Decision {
        const requestId = event.request.request
        return {
            kind,
            scoped: Boolean(this.#contexts?.length),
            age: this.#candidate.age,
            run: (answeredEarly) => phase === 'beforeRequestSent'
                ? this.#answerRequest(event as local.NetworkBeforeRequestSentParameters, answeredEarly)
                : this.#answerResponse(event as Response, aborts),
            lose: (winner) => {
                if (phase === 'beforeRequestSent' && winner.kind === 'defer' && this.#requestOverwrites[0]?.abort) {
                    // the abort still acts on this request when the response starts
                    return this.#handOverAbort(requestId)
                }
                if (needsResponse && winner.kind === 'answer') {
                    this.#warnAboutLostResponse(requestId)
                }
                this.#emit('continue', requestId)
            }
        }
    }

    #warnAboutLostResponse(requestId: string) {
        if (this.#warnedAboutLostResponse) {
            return
        }
        this.#warnedAboutLostResponse = true
        log.warn(
            `Request ${requestId} of a mock.respond() that needs the response: ` +
            'another mock of the same request acted on it before it was sent, so this mock\'s response may not apply ' +
            '(Firefox can not replace a response body after the request was sent).'
        )
    }

    #handOverAbort(requestId: string) {
        this.#abortsHandedOver.add(requestId)
        if (this.#abortsHandedOver.size > MAX_ABORT_HAND_OVERS) {
            this.#abortsHandedOver.delete(this.#abortsHandedOver.values().next().value!)
        }
    }

    // `respond()` rejects `fetchResponse: false` on a mock that filters on the response, which needs the backend
    #answersEarly() {
        const overwrite = this.#respondOverwrites[0]?.overwrite
        if (!overwrite) {
            return false
        }
        return ('fetchResponse' in overwrite && overwrite.fetchResponse === false) || this.#mustAnswerBeforeRequestSent()
    }

    // the queues are read again here: another request may have used a once entry while this one waited
    #answerRequest(request: local.NetworkBeforeRequestSentParameters, answeredEarly: () => void) {
        const requestId = request.request.request
        if (this.#requestOverwrites[0]?.abort) {
            return this.#fail(this.#requestOverwrites, requestId)
        }

        if (this.#answersEarly()) {
            const { overwrite } = this.#take(this.#respondOverwrites)
            const responseData = parseOverwrite(overwrite as RespondWithOptions, this.#eventForEarlyResponse(request))
            if (responseData.body) {
                this.#overwrittenResponseBodies.set(requestId, responseData.body)
            }
            this.#emit('overwrite', request)
            answeredEarly()
            return this.#track(requestId, this.#browser.networkProvideResponse({
                request: requestId,
                statusCode: 200,
                ...responseData
            }))
        }

        if (this.#requestOverwrites.length > 0) {
            const { overwrite } = this.#take(this.#requestOverwrites)
            const requestData = overwrite ? parseOverwrite(overwrite as RequestWithOptions, request) : {}
            this.#emit('overwrite', request)
            return this.#track(requestId, this.#browser.networkContinueRequest({
                request: requestId,
                ...requestData
            }))
        }

        this.#emit('continue', requestId)
        return this.#track(requestId, this.#browser.networkContinueRequest({ request: requestId }))
    }

    #answerResponse(response: Response, aborts: boolean) {
        const requestId = response.request.request
        if (aborts && this.#requestOverwrites[0]?.abort) {
            return this.#fail(this.#requestOverwrites, requestId)
        }

        const overwrite = this.#respondOverwrites[0]?.overwrite && this.#take(this.#respondOverwrites).overwrite
        if (overwrite) {
            const responseData = parseOverwrite(overwrite as RespondWithOptions, response)
            if (responseData.body) {
                this.#overwrittenResponseBodies.set(requestId, responseData.body)
            }
            // a `fetchResponse: false` answer that gave way before the request was sent keeps the status of the early answer
            const statusCode = 'fetchResponse' in overwrite && overwrite.fetchResponse === false ? { statusCode: 200 } : {}
            this.#emit('overwrite', response)
            return this.#track(
                requestId,
                this.#browser.networkProvideResponse({ request: requestId, ...statusCode, ...responseData }),
                (err: Error) => this.#handleUnsupportedOverwrite(err, requestId)
            )
        }

        this.#emit('continue', requestId)
        return this.#track(requestId, this.#browser.networkProvideResponse({ request: requestId }))
    }

    #fail(queue: Overwrite[], requestId: string) {
        this.#take(queue)
        this.#emit('fail', requestId)
        return this.#track(requestId, this.#browser.networkFailRequest({ request: requestId }))
    }

    #take(queue: Overwrite[]) {
        return queue[0].once ? queue.shift()! : queue[0]
    }

    #track(requestId: string, call: Promise<unknown>, onError: (err: Error) => unknown = this.#handleNetworkProvideResponseError) {
        return this.#withBlockedRequestTracking(requestId, call.catch(onError))
    }

    /**
     * `fetchResponse: false` answers before a response exists. Callbacks are
     * typed to receive one, so give them the status this mock sends by default.
     * A callback can still replace that status.
     */
    #eventForEarlyResponse(request: local.NetworkBeforeRequestSentParameters) {
        return {
            ...request,
            response: {
                status: 200,
                headers: []
            }
        }
    }

    async #handleResponseCompleted(response: Response) {
        if (!this.#isOwnEvent(response)) {
            return
        }
        if (this.#restored) {
            return
        }
        /**
         * don't do anything if:
         * - request is not matching the pattern
         * - data collection is disabled
         */
        if (
            this.#browser.options.maxSpyCollectedBodySize === 0 ||
            !this.#pattern.test(response.request.url) ||
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
        this.#hasOneBodyReadStarted = true

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
            /**
             * the body read can settle after `waitForResponse()` continued without it and
             * `clear()` removed this call: it must not count for the next responses
             */
            if (this.#calls.includes(call)) {
                this.#hasOneResponseCollected = true
            }
            this.#requestPostData.delete(response.request.request)
        }
    }

    /**
     * It appears that the networkProvideResponse method may throw an "no such request" error even though the request
     * is marked as "blocked", in these cases we can safely ignore the error.
     * @param err Bidi message error
     */
    /**
     * Firefox only takes a response body in `network.provideResponse` while
     * the request is blocked in `beforeRequestSent`, not once the response
     * started (https://wpt.fyi/results/webdriver/tests/bidi/network/provide_response).
     * Answer there, like `fetchResponse: false`, unless the mock filters on the
     * response, which needs the backend.
     */
    #mustAnswerBeforeRequestSent () {
        if (!this.#browser.isFirefox) {
            return false
        }
        if (this.#filterOptions.statusCode !== undefined || this.#filterOptions.responseHeaders !== undefined) {
            return false
        }
        if (!this.#warnedAboutEarlyAnswer) {
            this.#warnedAboutEarlyAnswer = true
            log.warn(
                'Firefox can not replace a response body after the request was sent. ' +
                'mock.respond() answers before the request is sent instead, as with `fetchResponse: false`.'
            )
        }
        return true
    }

    /**
     * A browser that can't replace the body once the response started rejects
     * `network.provideResponse`, which would leave the request blocked. Let the
     * real response through and say so, instead of hanging the test.
     */
    #handleUnsupportedOverwrite (err: Error, requestId: string) {
        if (!err.message.includes('unsupported operation')) {
            return this.#handleNetworkProvideResponseError(err)
        }
        log.warn(
            `mock.respond() could not replace the response of request ${requestId}: ${err.message}. ` +
            'The page received the real response. Use `fetchResponse: false` to answer before the request is sent.'
        )
        return this.#browser.networkProvideResponse({ request: requestId }).catch(this.#handleNetworkProvideResponseError)
    }

    /**
     * The error of a network command that answers a paused request. It runs in a network
     * event listener: no caller waits for it, so it is logged, not thrown (a thrown error
     * would be an unhandled rejection). A request that is gone needs no answer.
     */
    #handleNetworkProvideResponseError = (err: Error) => {
        if (err.message.endsWith('no such request')) {
            return
        }
        logBackgroundError(log, 'Failed to answer a paused request', err, this.#browser)
    }

    /**
     * Read a cached binary overwrite as a Buffer in Node.js or Uint8Array in browsers.
     */
    getBinaryResponse(requestId: string): Uint8Array | null {
        const body = this.#overwrittenResponseBodies.get(requestId)
        if (body?.type !== 'base64') {
            return null
        }
        if (/[^A-Za-z0-9+/=\s]/.test(body.value)) {
            log.warn(`Invalid base64 data for request ${requestId}`)
            return null
        }
        return decodeBase64(body.value)
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
        if (
            requestWithPostData.postData !== undefined ||
            this.#browser.options.maxSpyCollectedBodySize === 0
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
        const event = request as unknown as NetworkEvent
        this.#observe('responseStarted', event)
        if (!request.isBlocked) {
            return
        }
        void (this.#decide('responseStarted', event) as Decision | undefined)?.run(() => {})
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

    #isOwnedContext(context: string) {
        return !!this.#contexts?.includes(context) || this.#descendantContexts.has(context)
    }

    /**
     * A blocked request belongs to the mock whose intercept paused it, whatever
     * context (e.g. an iframe) it came from; the intercept is already scoped to
     * the held contexts. Observed requests are matched on the context tree, or
     * on a call this mock already recorded, as the tree can lag behind events.
     */
    #isOwnEvent(event: { context: string | null, isBlocked?: boolean, intercepts?: string[], request: { request: string } }) {
        if (!this.#contexts?.length) {
            return true
        }
        if (event.isBlocked) {
            return !!event.intercepts?.includes(this.#mockId)
        }
        return (event.context !== null && this.#isOwnedContext(event.context)) || !!this.#getCall(event.request.request)
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
                    acc[name] = decodeHeader(value)
                    return acc
                }, {} as Record<string, string>))
                : Object.entries(this.#filterOptions.requestHeaders).every(([key, value]) => {
                    const header = request.request.headers.find(({ name }) => name === key)
                    if (!header) {
                        return false
                    }

                    return decodeHeader(header.value) === value
                })
        }

        if (isRequestMatching && includePostData) {
            isRequestMatching = this.#matchesPostDataFilter(request as RequestWithPostData<T>)
        }

        if (isRequestMatching && this.#filterOptions.responseHeaders && 'response' in request) {
            isRequestMatching = typeof this.#filterOptions.responseHeaders === 'function'
                ? this.#filterOptions.responseHeaders(request.response.headers.reduce((acc, { name, value }) => {
                    acc[name] = decodeHeader(value)
                    return acc
                }, {} as Record<string, string>))
                : Object.entries(this.#filterOptions.responseHeaders).every(([key, value]) => {
                    const header = request.response.headers.find(({ name }) => name === key)
                    if (!header) {
                        return false
                    }

                    return decodeHeader(header.value) === value
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
        this.#hasOneBodyReadStarted = false
        this.#blockedRequests.clear()
        this.#abortsHandedOver.clear()
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
         * Concurrent or repeated calls share a single restore so the intercept
         * is only removed once, removing it twice fails with "no such intercept".
         */
        if (!this.#restorePromise) {
            this.#restorePromise = this.#restore().catch((err) => {
                this.#restorePromise = undefined
                throw err
            })
        }
        return this.#restorePromise
    }

    async #restore() {
        /**
         * Snapshot before reset()/clear() — those clear `#blockedRequests`, and we
         * still need to continue any in-flight blocked requests after cleanup.
         */
        const blockedRequestIds = Array.from(this.#blockedRequests)
        // a request this mock still waits on is released by the arbiter, which keeps knowing its intercept
        arbiterOf(this.#browser).remove(this.#candidate)
        if (this.#onContextDestroyed) {
            this.#browser.off('browsingContext.contextDestroyed', this.#onContextDestroyed)
            this.#onContextDestroyed = undefined
        }
        if (this.#onContextCreated) {
            this.#browser.off('browsingContext.contextCreated', this.#onContextCreated)
            this.#onContextCreated = undefined
        }
        this.reset()
        this.#respondOverwrites = []
        const handle = this.#sessionKey ?? await this.#browser.getWindowHandle()

        log.trace(`Restoring mock for ${handle}`)
        SESSION_MOCKS[handle]?.delete(this as WebDriverInterception)

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
        if (this.#mockId) {
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
        this.#assertCanSkipFetch(params)
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
     * A status or response-header filter matches the backend response.
     * `fetchResponse: false` never calls the backend, so the filter cannot
     * be decided and must not be silently ignored or bypassed by fetching.
     */
    #assertCanSkipFetch(params: Omit<RespondWithOptions, 'body'>) {
        if (params.fetchResponse !== false) {
            return
        }

        const filtersOnResponse = this.#filterOptions.statusCode !== undefined ||
            this.#filterOptions.responseHeaders !== undefined
        if (!filtersOnResponse) {
            return
        }

        throw new Error(
            'fetchResponse: false cannot be used when the mock filters on statusCode or responseHeaders. ' +
            'Those filters need the backend response, and this option does not call the backend.'
        )
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

    /**
     * Whether this mock belongs to the given browser session, and to the given tab or
     * parallel test if one is passed. `SESSION_MOCKS` is shared by all instances of a
     * multi-remote browser. Compares session ids rather than objects so that a client attached
     * to the same session via `attach()` still owns mocks created by another client of that session.
     * @param browser        browser instance to check
     * @param scope.context  a tab: only mocks made for that tab match
     * @param scope.test     the window of a parallel test: only mocks that test created match, also on tabs it opened
     * @returns              `true` if this mock belongs to that browser's session (and scope)
     */
    isOwnedBy(browser: WebdriverIO.Browser, { context, test }: { context?: string, test?: string } = {}) {
        return this.#browser.sessionId === browser.sessionId &&
            (context === undefined || Boolean(this.#contexts?.includes(context))) &&
            (test === undefined || this.#test === test)
    }

    /**
     * Whether this mock has the given scope: the same tabs, or none for a session-wide mock.
     */
    isScopedTo(contexts?: string[]) {
        const own = this.#contexts ?? []
        const other = contexts ?? []
        return own.length === other.length && own.every((context, index) => context === other[index])
    }

    isSameDefinition(url: string | URLPattern | globalThis.URLPattern, filterOptions: MockFilterOptions = {}) {
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
                /**
                 * The response completed, but the browser did not return its body in time.
                 * Firefox can leave `network.getData` unanswered for a response that it
                 * revalidated with 304 Not Modified (https://bugzilla.mozilla.org/show_bug.cgi?id=2077785).
                 * Continue without the body: it is still added to `calls` if it arrives later.
                 * A response that started but did not complete (e.g. it failed) still times out.
                 */
                if (this.#hasOneBodyReadStarted) {
                    log.warn(`waitForResponse: a response was received, but its body was not collected within ${timeout}ms, continuing without it`)
                    return true
                }
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
 * brand every mock, see `@wdio/utils` `kind.ts`
 */
setWdioKind(WebDriverInterception.prototype, 'mock')

export function parseUrlPattern(url: string | URLPattern | globalThis.URLPattern): URLPattern {
    /**
     * return early if it's already a URLPattern
     */
    if (typeof url === 'object') {
        return url as URLPattern
    }

    /**
     * A URLPattern `*` already matches any characters, `/` included, so a
     * glob like `**` + `/api` means the same as `*` + `/api`. Each extra `*`
     * adds a group to the compiled regular expression, though, and testing
     * it against a long URL that does not match (e.g. a `data:` URL) then
     * backtracks for seconds to minutes, which blocks the process.
     */
    url = url.replace(/(?<!\\)\*{2,}/g, '*')

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
