import type { URL as URLType } from 'node:url'

import WebDriverRequest from './index.js'

export default class RequestFactory {
    static getInstance (
        method: string,
        endpoint: string,
        body?: Record<string, unknown>,
        isHubCommand: boolean = false
    ): WebDriverRequest {
        if (process?.versions?.node) {
            const reqModule = require('./node')
            // we either need to get the default export explicitly in the prod case, or implicitly
            // in the case of jest mocking
            const NodeJSRequest = reqModule.default || reqModule
            return new NodeJSRequest(method, endpoint, body, isHubCommand)
        }

        const BrowserRequest = require('./browser').default
        return new BrowserRequest(method, endpoint, body, isHubCommand)
    }
}

export class URLFactory {
    static async getInstance (uri: string): Promise<URLType> {
        if (process?.versions?.node) {
            const { URL } = await import('url')
            return new URL(uri)
        }
        return new window.URL(uri) as URLType
    }
}
