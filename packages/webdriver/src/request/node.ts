import dns from 'node:dns'
import { fetch, Agent, type RequestInit as UndiciRequestInit, ProxyAgent, type Dispatcher } from 'undici'

import { environment } from '../environment.js'
import { WebDriverRequest } from './request.js'
import type { RequestOptions } from './types.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
dns.setDefaultResultOrder('ipv4first')

const { PROXY_URL, NO_PROXY } = environment.value.variables
const SESSION_DISPATCHERS: Map<string, Dispatcher> = new Map()

/**
 * Node implementation of WebDriverRequest using undici fetch
 */
export class FetchRequest extends WebDriverRequest {
    fetch (url: URL, opts: RequestInit) {
        return fetch(url, opts as UndiciRequestInit) as unknown as Promise<Response>
    }

    private getDispatcher(url: URL, options: RequestOptions, sessionId?: string): Dispatcher {
        if (sessionId && SESSION_DISPATCHERS.has(sessionId)) {
            return SESSION_DISPATCHERS.get(sessionId)!
        }

        /**
         * Use a proxy agent if we have a proxy url set
         */
        const shouldUseProxy =
            PROXY_URL && !NO_PROXY?.some((str) => url.hostname.endsWith(str))

        const dispatcher = shouldUseProxy ? new ProxyAgent({
            uri: PROXY_URL,
            connectTimeout: options.connectionRetryTimeout,
            headersTimeout: options.connectionRetryTimeout,
            bodyTimeout: options.connectionRetryTimeout,
        }) :
            new Agent({
                connectTimeout: options.connectionRetryTimeout,
                headersTimeout: options.connectionRetryTimeout,
                bodyTimeout: options.connectionRetryTimeout,
            })

        if (sessionId){
            SESSION_DISPATCHERS.set(sessionId, dispatcher)
        }

        return dispatcher
    }

    async createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false) {
        const { url, requestOptions } = await super.createOptions(options, sessionId, isBrowser)

        ;(requestOptions as UndiciRequestInit).dispatcher = this.getDispatcher(url, options)
        return { url, requestOptions }
    }
}
