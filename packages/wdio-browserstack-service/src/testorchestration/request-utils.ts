import got from 'got'
import { BStackLogger } from '../bstackLogger.js'
import APIUtils from '../cli/apiUtils.js'

/**
 * Utility class for making API requests to the BrowserStack orchestration API
 */
export class RequestUtils {
    /**
     * Makes a request to the test orchestration split tests endpoint
     */
    static async testOrchestrationSplitTests(reqEndpoint: string, data: any) {
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
        data?: any,
        params?: Record<string, any>,
        extraHeaders?: Record<string, string>
    }) {
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
            let response
            const requestOptions: any = {
                headers,
                responseType: 'json'
            }

            if (options.data) {
                requestOptions.json = options.data
            }

            if (options.params) {
                requestOptions.searchParams = options.params
            }

            if (method === 'GET') {
                response = await got.get(url, requestOptions)
            } else if (method === 'POST') {
                response = await got.post(url, requestOptions)
            } else if (method === 'PUT') {
                response = await got.put(url, requestOptions)
            } else {
                throw new Error(`Unsupported HTTP method: ${method}`)
            }

            BStackLogger.debug(`Orchestration request made to URL: ${url} with method: ${method}`)

            let responseObj: any = {}
            try {
                responseObj = response.body
            } catch (e) {
                BStackLogger.debug(`Failed to parse JSON response: ${e} - ${response.body}`)
            }

            if (responseObj) {
                responseObj.next_poll_time = response.headers.next_poll_time ||
                    String(Date.now())
                responseObj.status = response.statusCode
            }

            return responseObj
        } catch (e) {
            BStackLogger.error(`Orchestration request failed: ${e} - ${url}`)
            return null
        }
    }
}

export default RequestUtils
