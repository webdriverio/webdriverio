import dns from 'node:dns'
import { fetch, Agent, type RequestInit as UndiciRequestInit, ProxyAgent, type Dispatcher, getGlobalDispatcher } from 'undici'

import { environment } from '../environment.js'
import { WebDriverRequest } from './request.js'
import type { RequestOptions } from './types.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
dns.setDefaultResultOrder('ipv4first')

export const SESSION_DISPATCHERS: Map<string, Dispatcher> = new Map()

/**
 * Node implementation of WebDriverRequest using undici fetch
 */
export class FetchRequest extends WebDriverRequest {
    async fetch (url: URL, opts: RequestInit) {
        const response = await fetch(url, opts as UndiciRequestInit) as unknown as Promise<Response>
        if (opts.method === 'DELETE') {
            // regex should only target the delete session request, not other
            // delete requests, full list: https://www.w3.org/TR/webdriver2/#endpoints
            const match = url.pathname.match(/\/session\/([^/]+)$/)
            const sessionId = match?.[1]
            if (sessionId) {
                this.cleanupSessionDispatcher(sessionId)
            }
        }
        return response
    }

    private getDispatcher(url: URL, options: RequestOptions, sessionId?: string): Dispatcher {
        if (sessionId && SESSION_DISPATCHERS.has(sessionId)) {
            return SESSION_DISPATCHERS.get(sessionId)!
        }

        /**
         * First check if a global dispatcher has been set (e.g. via setGlobalDispatcher)
         */
        try {
            const globalDispatcher = getGlobalDispatcher()

            // Check if the global dispatcher appears to be customized
            // The default dispatcher is typically an Agent, but we check if it's
            // a ProxyAgent or has proxy-specific properties
            if (globalDispatcher && (
                globalDispatcher.constructor.name === 'ProxyAgent' ||
                'proxy' in globalDispatcher ||
                // Also check for other custom dispatcher types
                (globalDispatcher.constructor.name !== 'Agent' && globalDispatcher.constructor.name !== 'MockAgent')
            )) {
                return globalDispatcher
            }
        } catch {
            // If getGlobalDispatcher fails for any reason, fall back to env vars
        }

        /**
         * Fall back to creating a dispatcher based on environment variables
         * Use a proxy agent if we have a proxy url set
         */
        const { PROXY_URL, NO_PROXY } = environment.value.variables
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

    private cleanupSessionDispatcher(sessionId: string) {
        const dispatcher = SESSION_DISPATCHERS.get(sessionId)
        if (dispatcher && typeof dispatcher.close === 'function') {
            // Close the dispatcher to free up resources
            dispatcher.close()
        }
        SESSION_DISPATCHERS.delete(sessionId)
    }

    async createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false) {
        const { url, requestOptions } = await super.createOptions(options, sessionId, isBrowser)

        ;(requestOptions as UndiciRequestInit).dispatcher = this.getDispatcher(url, options, sessionId)
        return { url, requestOptions }
    }
}
