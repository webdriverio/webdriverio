import Interception from '.'
import { ERROR_REASON } from '../../constants'

/**
 * Network interception class based on a WebDriver compliant endpoint.
 * Instead of directly using the CDP with Puppeteer this version of the
 * class uses a WebDriver extension to trigger the same behavior on a
 * compliant backend.
 */
export default class WebDriverInterception extends Interception {
    mockId: number = NaN;

    async init () {
        const { mockId } = await this.browser.mockRequest(this.url, this.filterOptions)
        this.mockId = mockId
    }

    /**
     * allows access to all requests made with given pattern
     */
    // @ts-ignore
    get calls () {
        return this.browser.call(
            async () => this.browser.mockCalls(this.mockId))
    }

    /**
     * Resets all information stored in the `mock.calls` set.
     */
    clear () {
        return this.browser.call(
            async () => this.browser.clearMockCalls(this.mockId, false))
    }

    /**
     * Does everything that `mock.clear()` does, and also
     * removes any mocked return values or implementations.
     */
    restore () {
        return this.browser.call(
            async () => this.browser.clearMockCalls(this.mockId, true))
    }

    /**
     * Always respond with same overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respond (overwrite: WebdriverIO.MockOverwrite, params: WebdriverIO.MockResponseParams = {}) {
        return this.browser.call(
            async () => this.browser.respondMock(
                this.mockId,
                { overwrite, params, sticky: true }
            )
        )
    }

    /**
     * Respond request once with given overwrite
     * @param {*} overwrites  payload to overwrite the response
     * @param {*} params      additional respond parameters to overwrite
     */
    respondOnce (overwrite: WebdriverIO.MockOverwrite, params: WebdriverIO.MockResponseParams = {}) {
        return this.browser.call(
            async () => this.browser.respondMock(
                this.mockId,
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
                this.mockId,
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
