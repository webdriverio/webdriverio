import WebDriverRequest from './index'
import type { URL as URLType } from 'url'

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
    static getInstance (uri: string): URLType {
        if (process?.versions?.node) {
            const { URL } = require('url')
            return new URL(uri)
        }
        return new window.URL(uri) as URLType
    }
}
