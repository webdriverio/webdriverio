import { BStackLogger } from '../bstackLogger.js'
import APIUtils from '../cli/apiUtils.js'
import fetchWrap from '../fetchWrapper.js'

/**
 * Utility class for making API requests to the BrowserStack orchestration API
 */
export class RequestUtils {
    /**
     * Makes a request to the test orchestration split tests endpoint
     */
    static async testOrchestrationSplitTests(reqEndpoint: string, data: Record<string, unknown>) {
        BStackLogger.debug('Processing Request for testOrchestrationSplitTests')
        return RequestUtils.makeOrchestrationRequest('POST', reqEndpoint, { data })
    }

    /**
     * Gets ordered tests from the test orchestration
     */
    static async getTestOrchestrationOrderedTests(reqEndpoint: string) {
        BStackLogger.debug('Processing Request for getTestOrchestrationOrderedTests')
        return RequestUtils.makeOrchestrationRequest('GET', reqEndpoint, {})
    }

    /**
     * Makes an orchestration request with the given method and data
     */
    static async makeOrchestrationRequest(method: 'GET' | 'POST' | 'PUT', reqEndpoint: string, options: {
        data?: unknown,
        params?: Record<string, string | number | boolean | undefined>,
        extraHeaders?: Record<string, string>
    }): Promise<Record<string, unknown> | string | null> {
        const jwtToken = process.env.BROWSERSTACK_TESTHUB_JWT || ''
        const headers: Record<string, string> = {
            'authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        if (options.extraHeaders) {
            Object.assign(headers, options.extraHeaders)
        }

        const url = `${APIUtils.DATA_ENDPOINT}/${reqEndpoint.replace(/^\//, '')}`

        try {
            const urlObject = new URL(url)
            if (options.params) {
                for (const [key, value] of Object.entries(options.params)) {
                    if (typeof value !== 'undefined') {
                        urlObject.searchParams.set(key, String(value))
                    }
                }
            }

            const requestInit: RequestInit = {
                method,
                headers
            }

            if (options.data) {
                requestInit.body = JSON.stringify(options.data)
            }

            if (!['GET', 'POST', 'PUT'].includes(method)) {
                throw new Error(`Unsupported HTTP method: ${method}`)
            }

            const response = await fetchWrap(urlObject.toString(), requestInit)

            BStackLogger.debug(`Orchestration request made to URL: ${urlObject.toString()} with method: ${method}`)

            const rawBody = await response.text()
            let responseObj: Record<string, unknown> | string = rawBody
            try {
                responseObj = rawBody ? JSON.parse(rawBody) : {}
            } catch (error) {
                BStackLogger.debug(`Failed to parse JSON response: ${error} - ${rawBody}`)
            }

            if (responseObj && typeof responseObj === 'object' && !Array.isArray(responseObj)) {
                return {
                    ...responseObj,
                    next_poll_time: response.headers.get('next_poll_time') || String(Date.now()),
                    status: response.status
                }
            }

            return typeof responseObj === 'string' ? responseObj : rawBody
        } catch (error) {
            BStackLogger.error(`Orchestration request failed: ${error} - ${url}`)
            return null
        }
    }
}

export default RequestUtils
