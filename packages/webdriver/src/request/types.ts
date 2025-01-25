import type { Options } from '@wdio/types'

export interface WebDriverResponse<T = unknown> {
    value: T
    /**
     * error case
     * https://w3c.github.io/webdriver/webdriver-spec.html#dfn-send-an-error
     */
    error?: string
    message?: string
    stacktrace?: string

    /**
     * JSONWP property
     */
    status?: number
    sessionId?: string
}

export type RequestLibResponse = Options.RequestLibResponse
export type RequestOptions = Omit<Options.WebDriver, 'capabilities'>

export interface RequestEventHandler {
    onRequest?: (ev: RequestStartEvent) => void
    onResponse?: (ev: RequestEndEvent) => void
    onRetry?: (ev: RequestRetryEvent) => void
    onPerformance?: (ev: RequestPerformanceEvent) => void
    onLogData?: (ev: BodyInit) => void
}

export type RequestStartEvent = RequestInit
export type RequestEndEvent = { result?: unknown, error?: Error }
export type RequestRetryEvent = { error: Error, retryCount: number }
export type RequestPerformanceEvent = { request: RequestInit, durationMillisecond: number, success: boolean, error?: Error, retryCount: number }
