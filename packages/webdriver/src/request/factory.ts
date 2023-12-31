import type { URL as URLType } from 'node:url'
import type FetchRequest from './request.js'

import type WebDriverRequest from './index.js'

interface Request {
    new (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand?: boolean): FetchRequest;
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
            EnvRequestLib = (await import('./request.js')).default
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
