import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { JsonCompatible } from '@wdio/types'

/**
 * HTTP request data. (copied from the puppeteer-core package as there is currently
 * no way to access these types otherwise)
 */
export type ResourcePriority = 'VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh'
export type MixedContentType = 'blockable' | 'optionally-blockable' | 'none'
export type ReferrerPolicy = 'unsafe-url' | 'no-referrer-when-downgrade' | 'no-referrer' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin'
export interface Request {
    /**
     * Request URL (without fragment).
     */
    url: string
    /**
     * Fragment of the requested URL starting with hash, if present.
     */
    urlFragment?: string
    /**
     * HTTP request method.
     */
    method: string
    /**
     * HTTP request headers.
     */
    headers: Record<string, string>
    /**
     * HTTP POST request data.
     */
    postData?: string
    /**
     * True when the request has POST data. Note that postData might still be omitted when this flag is true when the data is too long.
     */
    hasPostData?: boolean
    /**
     * The mixed content export type of the request.
     */
    mixedContentType?: MixedContentType
    /**
     * Priority of the resource request at the time request is sent.
     */
    initialPriority: ResourcePriority
    /**
     * The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/
     */
    referrerPolicy: ReferrerPolicy
    /**
     * Whether is loaded via link preload.
     */
    isLinkPreload?: boolean
}

export interface Matches extends Request {
    /**
     * body response of actual resource
     */
    body: string | Buffer | JsonCompatible
    /**
     * HTTP response headers.
     */
    responseHeaders: Record<string, string>
    /**
     * HTTP response status code.
     */
    statusCode: number
}

export type MockOverwriteFunction = (request: Matches, client: CDPSession) => Promise<string | Record<string, any>>
export type MockOverwrite = string | Record<string, any> | MockOverwriteFunction

export type MockResponseParams = {
    statusCode?: number | ((request: Matches) => number)
    headers?: Record<string, string> | ((request: Matches) => Record<string, string>)
    /**
     * fetch real response before responding with mocked data. Default: true
     */
    fetchResponse?: boolean
}

export type MockFilterOptions = {
    method?: string | ((method: string) => boolean)
    headers?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    requestHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    responseHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean)
    statusCode?: number | ((statusCode: number) => boolean)
    postData?: string | ((payload: string | undefined) => boolean)
}

export type ErrorCode = 'Failed' | 'Aborted' | 'TimedOut' | 'AccessDenied' | 'ConnectionClosed' | 'ConnectionReset' | 'ConnectionRefused' | 'ConnectionAborted' | 'ConnectionFailed' | 'NameNotResolved' | 'InternetDisconnected' | 'AddressUnreachable' | 'BlockedByClient' | 'BlockedByResponse'

export type ThrottlePreset = 'offline' | 'GPRS' | 'Regular2G' | 'Good2G' | 'Regular3G' | 'Good3G' | 'Regular4G' | 'DSL' | 'WiFi' | 'online'
export interface CustomThrottle {
    offline: boolean
    downloadThroughput: number
    uploadThroughput: number
    latency: number
}
export type ThrottleOptions = ThrottlePreset | CustomThrottle
