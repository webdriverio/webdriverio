import type { URL as URLType } from 'node:url'
import type NodeJSRequest from './node'
import type BrowserRequest from './browser'

import WebDriverRequest from './index.js'

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
                ? (await import('./node')).default
                : (await import('./browser')).default
        }

        return new EnvRequestLib(method, endpoint, body, isHubCommand)
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
