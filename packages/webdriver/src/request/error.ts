import { transformCommandLogResult } from '@wdio/utils'

import { isConnectionTimeoutSignal } from './abort.js'
import { REG_EXPS } from './constants.js'

/**
 * `Error.cause` is an ES2022 property. Read it without naming it on `Error`,
 * so this file still type-checks at the browser bundle's ES2021 lib.
 */
function errorCause (err: object): unknown {
    if (!('cause' in err)) {
        return undefined
    }
    return (err as { cause?: unknown }).cause
}

abstract class WebDriverError extends Error {
    abstract url: URL
    abstract opts: RequestInit

    /**
     * return timeout error with information about the executing command on which the test hangs
     */
    computeErrorMessage() {
        const cmdName = this.#getExecCmdName()
        const cmdArgs = this.#getExecCmdArgs(this.opts)

        const cmdInfoMsg = `when running "${cmdName}" with method "${this.opts.method}"`
        const cmdArgsMsg = cmdArgs ? ` and args ${cmdArgs}` : ''

        return `WebDriverError: ${this.message} ${cmdInfoMsg}${cmdArgsMsg}`
    }

    #getExecCmdName(): string {
        const { href } = this.url
        const res = href.match(REG_EXPS.commandName) || []

        return res[1] || href
    }

    #getExecCmdArgs(requestOptions: RequestInit): string {
        const { body: cmdJson } = requestOptions as unknown as { body: Record<string, unknown> }

        if (typeof cmdJson !== 'object') {
            return ''
        }

        const transformedRes = transformCommandLogResult(cmdJson)

        if (typeof transformedRes === 'string') {
            return transformedRes
        }

        if (typeof cmdJson.script === 'string') {
            const scriptRes = cmdJson.script.match(REG_EXPS.execFn) || []

            return `"${scriptRes[1] || cmdJson.script}"`
        }

        return Object.keys(cmdJson).length ? `"${JSON.stringify(cmdJson)}"` : ''
    }
}

export class WebDriverRequestError extends WebDriverError {
    url: URL
    opts: RequestInit

    statusCode?: number
    body?: unknown
    code?: string

    constructor (err: Error, url: URL, opts: RequestInit) {
        let message = err.message
        if (err.message === 'fetch failed') {
            message = `Failed to fetch [${opts.method}] ${url.href}: please make sure you have a WebDriver compatible server running on ${url.origin}`
        }

        super(message)
        this.url = url
        this.opts = opts

        /**
         * A request that exceeds `connectionRetryTimeout` aborts our signal.
         * Node reports that as `TimeoutError`. Chrome and Edge 103 to 123
         * report `AbortError` instead, and older browsers have no
         * `AbortSignal.timeout`, so the signal itself is the source of truth.
         */
        const cause = errorCause(err)
        const isAbortTimeout = err.name === 'TimeoutError' || isConnectionTimeoutSignal(this.opts.signal)
        const errorCode = typeof cause === 'object' && cause && 'code' in cause && typeof cause.code === 'string'
            ? cause.code
            : 'code' in err && typeof err.code === 'string'
                ? err.code
                : isAbortTimeout
                    ? 'ETIMEDOUT'
                    : undefined
        if (errorCode) {
            this.code = errorCode
            this.message = errorCode === 'UND_ERR_CONNECT_TIMEOUT' || isAbortTimeout
                ? 'Request timed out! Consider increasing the "connectionRetryTimeout" option.'
                : 'Request failed with error code ' + errorCode
        }

        if (typeof cause === 'object' && cause) {
            this.statusCode = 'statusCode' in cause && typeof cause.statusCode === 'number'
                ? cause.statusCode : undefined
            this.body = 'body' in cause ? cause.body : undefined
        }

        this.message = this.computeErrorMessage()
    }
}

export class WebDriverResponseError extends WebDriverError {
    url: URL
    opts: RequestInit
    constructor (response: unknown, url: URL, opts: RequestInit) {
        const errorObj: { message?: string, error?: string, class?: string, name?: string } = !response || typeof response !== 'object' || !('body' in response) || !response.body
            ? new Error('Response has empty body')
            : typeof response.body === 'string' && response.body.length
                ? new Error(response.body)
                : typeof response.body !== 'object'
                    ? new Error('Unknown error')
                    : 'value' in response.body && response.body.value
                        ? response.body.value
                        : response.body

        /**
         * e.g. in Firefox or Safari, error are following the following structure:
         * ```
         * {
         *   value: {
         *     error: '...',
         *     message: '...',
         *     stacktrace: '...'
         *   }
         * }
         * ```
         */
        let errorMessage = errorObj.message || errorObj.error || errorObj.class || 'unknown error'

        /**
         * Improve Chromedriver's error message for an invalid selector
         *
         * Chrome:
         *  error: 'invalid argument'
         * message: 'invalid argument: invalid locator\n  (Session info: chrome=122.0.6261.94)'
         * Firefox:
         *  error: 'invalid selector'
         *  message: 'Given xpath expression "//button" is invalid: NotSupportedError: Operation is not supported'
         * Safari:
         *  error: 'timeout'
         *  message: ''
         */
        if (typeof errorMessage === 'string' && errorMessage.includes('invalid locator')) {
            const requestOptions = opts.body as unknown as { using: string; value: string }
            errorMessage = (
                `The selector "${requestOptions.value}" used with strategy "${requestOptions.using}" is invalid!`
            )
        }

        super(errorMessage)
        if (errorObj.error) {
            this.name = errorObj.error
        } else if (errorMessage && errorMessage.includes('stale element reference')) {
            this.name = 'stale element reference'
        } else {
            this.name = errorObj.name || 'WebDriver Error'
        }

        Error.captureStackTrace(this, WebDriverResponseError)
        this.url = url
        this.opts = opts
        this.message = this.computeErrorMessage()
    }
}
