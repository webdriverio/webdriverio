import dns from 'node:dns'
import { fetch, Agent, type RequestInit as UndiciRequestInit, ProxyAgent } from 'undici'

import WebDriverRequest from './index.js'
import type { RequestOptions } from './types.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
dns.setDefaultResultOrder('ipv4first')

/**
 * Node implementation of WebDriverRequest using undici fetch
 */
export default class FetchRequest extends WebDriverRequest {
    protected fetch (url: URL, opts: RequestInit) {
        return fetch(url, opts as UndiciRequestInit) as Promise<Response>
    }

    protected async _createOptions (options: RequestOptions, sessionId?: string, isBrowser: boolean = false) {
        const { url, requestOptions } = await super._createOptions(options, sessionId, isBrowser)

        /**
         * Use a proxy agent if we have a proxy url set
         */
        const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
        const dispatcher = proxyUrl
            ? new ProxyAgent(proxyUrl)
            : new Agent({ connectTimeout: options.connectionRetryTimeout })

        ;(requestOptions as UndiciRequestInit).dispatcher = dispatcher
        return { url, requestOptions }
    }
}
