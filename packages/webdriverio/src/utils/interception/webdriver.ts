import logger from '@wdio/logger'
import { type local, type remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

import Interception from './index.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import type { MockOverwrite, MockResponseParams, ErrorReason } from './types.js'

const log = logger('WebDriverInterception')

let hasSubscribedToEvents = false

type ContinueRequestParameters = Omit<remote.NetworkContinueRequestParameters, 'request'>

/**
 * Network interception class based on a WebDriver Bidi implementation.
 */
export default class WebDriverInterception extends Interception {
    #mockId?: string
    #restored = false
    #requestOverwrites?: ContinueRequestParameters
    #pattern?: URLPattern

    async init () {
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
        // const url = await this.browser.getUrl()
        // this.#pattern = new URLPattern(this.url)
        const interception = await this.browser.networkAddIntercept({
            phases: ['beforeRequestSent', 'responseStarted'],
            urlPatterns: [{
                type: 'pattern',
                // protocol: '*', // this.#pattern.protocol,
                // hostname: '*', // this.#pattern.hostname,
                pathname: '\\*.css', // this.#pattern.pathname,
                // port: '*', // this.#pattern.port,
                // search: '*', // this.#pattern.search,
            }],
        })
        this.#mockId = interception.intercept

        /**
         * attach network listener to this mock
         */
        this.browser.on('network.beforeRequestSent', this.#handleBeforeRequestSent.bind(this))
        this.browser.on('network.responseCompleted', this.#handleResponseCompleted.bind(this))
    }

    #handleBeforeRequestSent(request: local.NetworkBeforeRequestSentParameters) {
        console.log('---->', request.request.url, this.respondOverwrites[0]);

        /**
         * check if request matches the mock url
         */
        if (!request.isBlocked) {
            console.log('DOESNT MATCH');
            return

            // return this.browser.networkContinueRequest({
            //     request: request.request.request,
            // })
        }

        /**
         * check if should abort the request
         */
        if (this.respondOverwrites[0].errorReason) {
            console.log('ABORT!', JSON.stringify(request, null, 4));

            return this.browser.networkFailRequest({ request: request.request.request }).then(() => {
                console.log('YPP!P!!!!!!');

            })
        }

        /**
         * continue request (possibly with overwrites)
         */
        // return this.browser.networkContinueRequest({
        //     ...(this.#requestOverwrites || {}),
        //     request: request.request.request,
        // })
    }

    #handleResponseCompleted(request: local.NetworkResponseCompletedParameters) {
        console.log('######>', request.request.url);

        /**
         * check if request matches the mock url
         */
        if (!WebDriverInterception.isMatchingRequest(this.url, request.request.url)) {
            // return this.browser.networkContinueResponse({
            //     request: request.request.request,
            // })
        }

//   cookies?: NetworkSetCookieHeader[];
//   credentials?: NetworkAuthCredentials;
//   headers?: NetworkHeader[];
//   reasonPhrase?: string;
//   statusCode?: JsUint;
        // return this.browser.networkContinueResponse({
        //     request: request.request.request,
        //     headers: {
        //         ...request.response.headers,

        //     },
        // })
    }

    continueRequest (overrides: ContinueRequestParameters) {
        return this.#requestOverwrites = overrides
    }

    /**
     * allows access to all requests made with given pattern
     */
    get calls () {
        return this.matches
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear () {
        this.matches = []
    }

    /**
     * Does what `mock.clear()` does and makes removes custom request overrides
     * and response overwrites
     */
    reset () {
        this.clear()
        this.#requestOverwrites = undefined
        this.respondOverwrites = []
    }

    /**
     * Does everything that `mock.reset()` does, and also
     * removes any mocked return values or implementations.
     * Restored mock does not emit events and could not mock responses
     */
    async restore () {
        this.reset()
        this.respondOverwrites = []
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
     */
    respond (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        this.#ensureNotRestored()
        this.respondOverwrites.push({ overwrite, params, sticky: true })
        return this
    }

    /**
     * Respond request once with given overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respondOnce (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        this.#ensureNotRestored()
        this.respondOverwrites.push({ overwrite, params })
        return this
    }

    /**
     * Abort the request with an error code
     */
    abort (errorReason: ErrorReason, sticky: boolean = true) {
        this.#ensureNotRestored()
        this.respondOverwrites.push({ errorReason, sticky })
        return this
    }

    /**
     * Abort the request once with an error code
     * @param {string} errorReason  error code of the response
     */
    abortOnce (errorReason: ErrorReason) {
        this.abort(errorReason, false)
        return this
    }

    #ensureNotRestored() {
        if (this.#restored) {
            throw new Error('This can\'t be done on restored mock')
        }
    }
}
