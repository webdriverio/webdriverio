import Interception from './index.js'
import { ERROR_REASON } from '../../constants.js'
import type { Matches, MockResponseParams, MockOverwrite } from './types'

/**
 * Network interception class based on a WebDriver compliant endpoint.
 * Instead of directly using the CDP with Puppeteer this version of the
 * class uses a WebDriver extension to trigger the same behavior on a
 * compliant backend.
 */
export default class WebDriverInterception extends Interception {
    mockId?: string

    async init () {
        if (this.url instanceof RegExp) {
            throw new Error('Regular Expressions as mock url are not supported')
        }
        const { mockId } = await this.browser.mockRequest(this.url, this.filterOptions)
        this.mockId = mockId
    }

    /**
     * allows access to all requests made with given pattern
     */
    get calls () {
        return this.browser.call(() => (
            this.browser.getMockCalls(this.mockId as string) as any as Matches[]
        ))
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear () {
        return this.browser.call(
            async () => this.browser.clearMockCalls(this.mockId as string))
    }

    /**
     * Does everything that `mock.clear()` does, and also
     * removes any mocked return values or implementations.
     */
    restore () {
        return this.browser.call(
            async () => this.browser.clearMockCalls(this.mockId as string, true))
    }

    /**
     * Always respond with same overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respond (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        return this.browser.call(
            async () => this.browser.respondMock(
                this.mockId as string,
                { overwrite, params, sticky: true }
            )
        )
    }

    /**
     * Respond request once with given overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respondOnce (overwrite: MockOverwrite, params: MockResponseParams = {}) {
        return this.browser.call(
            async () => this.browser.respondMock(
                this.mockId as string,
                { overwrite, params }
            )
        )
    }

    /**
     * Abort the request with an error code
     * @param {string} errorCode  error code of the response
     */
    abort (errorReason: string, sticky: boolean = true) {
        if (typeof errorReason !== 'string' || !ERROR_REASON.includes(errorReason)) {
            throw new Error(`Invalid value for errorReason, allowed are: ${ERROR_REASON.join(', ')}`)
        }
        return this.browser.call(
            async () => this.browser.respondMock(
                this.mockId as string,
                { errorReason, sticky }
            )
        )
    }

    /**
     * Abort the request once with an error code
     * @param {string} errorReason  error code of the response
     */
    abortOnce (errorReason: string) {
        return this.abort(errorReason, false)
    }
}
