import type { Options } from '@wdio/types'

export interface WebDriverResponse {
    value: any
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
