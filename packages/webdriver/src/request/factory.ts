import type { URL as URLType } from 'node:url'
import type NodeJSRequest from './node.js'
import type BrowserRequest from './browser.js'

import type WebDriverRequest from './index.js'

interface Request {
    new (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand?: boolean): NodeJSRequest | BrowserRequest;
}

let EnvRequestLib: Request
export default class RequestFactory {
    static async getInstance (
        method: string,
        endpoint: string,
        body?: Record<string, unknown>,
        isHubCommand: boolean = false
    ): Promise<WebDriverRequest> {
        if (!EnvRequestLib) {
            EnvRequestLib = process?.versions?.node
                ? (await import('./node.js')).default
                : (await import('./browser.js')).default
        }

        return new EnvRequestLib(method, endpoint, body, isHubCommand)
    }
}

export class URLFactory {
    static async getInstance (uri: string): Promise<URLType> {
        if (process?.versions?.node) {
            const { URL } = await import('node:url')
            return new URL(uri)
        }
        return new window.URL(uri) as URLType
    }
}
