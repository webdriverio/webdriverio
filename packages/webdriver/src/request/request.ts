import { performance } from 'node:perf_hooks'
import type { URL } from 'node:url'

import type { Options } from '@wdio/types'

import WebDriverRequest, { RequestLibError } from './index.js'

export default class FetchRequest extends WebDriverRequest {
    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super(method, endpoint, body, isHubCommand)
    }

    protected async _libRequest (url: URL, opts: Options.RequestLibOptions) {
        try {
            let headers: any = { ...opts.headers }

            if (opts.username && opts.password) {
                const encodedAuth = Buffer.from(`${opts.username}:${opts.password}`, 'utf8').toString('base64')
                headers = {
                    ...headers,
                    Authorization: `Basic ${encodedAuth}`,
                }
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), opts.timeout || 120000)

            const response = await fetch(url, {
                method: opts.method,
                body: opts.body ?? JSON.stringify(opts.json),
                headers,
                signal: controller.signal,
            })

            // Clear the timeout as the request completed successfully
            clearTimeout(timeoutId)

            return {
                statusCode: response.status,
                body: await response.json() ?? {},
            } as Options.RequestLibResponse
        } catch (err: any) {
            if (!(err instanceof Error)) {
                throw new RequestLibError(err.message || err)
            }
            throw err
        }
    }

    protected _libPerformanceNow(): number {
        return performance.now()
    }
}
