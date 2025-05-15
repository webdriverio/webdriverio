import type { Options } from '@testplane/wdio-types'

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
}

export type RequestStartEvent = RequestLibOptions
export type RequestEndEvent = { result?: unknown, error?: Error }
export type RequestRetryEvent = { error: Error, retryCount: number }
export type RequestPerformanceEvent = { request: RequestInit, durationMillisecond: number, success: boolean, error?: Error, retryCount: number }

export type Agents = { http?: unknown, https?: unknown }

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options' | 'trace'

export interface RequestLibOptions {
    agent?: Agents
    followRedirect?: boolean
    headers?: Record<string, string | string[] | undefined>
    https?: Record<string, unknown>
    json?: Record<string, unknown>
    method?: Method
    responseType?: 'json' | 'buffer' | 'text'
    retry?: { limit: number, methods?: Method[], calculateDelay?: (retryOptions: { computedValue: number }) => number }
    searchParams?: Record<string, string | number | boolean | null | undefined> | URLSearchParams
    throwHttpErrors?: boolean
    timeout?: { response: number }
    url?: URL
    path?: string
    username?: string
    password?: string
    body?: unknown
}
