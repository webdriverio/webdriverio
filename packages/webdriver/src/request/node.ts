import dns from 'node:dns'
import { fetch, Agent, type RequestInit as UndiciRequestInit, ProxyAgent } from 'undici'

import { environment } from '../environment.js'
import { WebDriverRequest } from './request.js'
import type { RequestOptions } from './types.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
dns.setDefaultResultOrder('ipv4first')

/**
 * Node implementation of WebDriverRequest using undici fetch
 */
export class FetchRequest extends WebDriverRequest {
    fetch (url: URL, opts: RequestInit) {
        return fetch(url, opts as UndiciRequestInit) as unknown as Promise<Response>
    }

    async createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false) {
        const { url, requestOptions } = await super.createOptions(options, sessionId, isBrowser)

        /**
         * Use a proxy agent if we have a proxy url set
         */
        const { PROXY_URL, NO_PROXY } = environment.value.variables

        const dispatcher = PROXY_URL && !NO_PROXY?.some((str) => url.hostname.endsWith(str))
            ? new ProxyAgent({
                uri: PROXY_URL,
                connectTimeout: options.connectionRetryTimeout,
                headersTimeout: options.connectionRetryTimeout,
                bodyTimeout: options.connectionRetryTimeout,
            })
            : new Agent({
                connectTimeout: options.connectionRetryTimeout,
                headersTimeout: options.connectionRetryTimeout,
                bodyTimeout: options.connectionRetryTimeout,
            })

        ;(requestOptions as UndiciRequestInit).dispatcher = dispatcher
        return { url, requestOptions }
    }
}
