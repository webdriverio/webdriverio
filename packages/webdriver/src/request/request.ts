import { performance } from 'node:perf_hooks'
import type { URL } from 'node:url'
import dns from 'node:dns'

import type { Options } from '@wdio/types'

import WebDriverRequest from './index.js'
import { WebDriverRequestError } from './error.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
if ('process' in globalThis && globalThis.process.versions?.node) {
    dns.setDefaultResultOrder('ipv4first')
}

export default class FetchRequest extends WebDriverRequest {
    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super(method, endpoint, body, isHubCommand)
    }

    protected async _libRequest (url: URL, opts: RequestInit): Promise<Options.RequestLibResponse> {
        try {
            const response = await fetch(url, {
                method: opts.method,
                body: JSON.stringify(opts.body),
                headers: opts.headers,
                signal: opts.signal,
            })

            // Cloning the response to prevent body unusable error
            const resp = response.clone()

            return {
                statusCode: resp.status,
                body: await resp.json() ?? {},
            } as Options.RequestLibResponse
        } catch (err: any) {
            if (!(err instanceof Error)) {
                throw new WebDriverRequestError(
                    new Error(`Failed to fetch ${url.href}: ${err.message || err || 'Unknown error'}`),
                    url,
                    opts
                )
            }

            throw new WebDriverRequestError(err, url, opts)
        }
    }

    protected _libPerformanceNow(): number {
        return performance.now()
    }
}
