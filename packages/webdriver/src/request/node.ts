import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { performance } from 'node:perf_hooks'
import type { URL } from 'node:url'

import got, { type OptionsOfTextResponseBody } from 'got'
import type { Options } from '@testplane/wdio-types'

import WebDriverRequest, { RequestLibError } from './index.js'

// As per this https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012 we are setting ipv4first as default IP resolver.
// This can be removed when we drop Node18 support.
dns.setDefaultResultOrder('ipv4first')

const agents: Options.Agents = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}

export class NodeJSRequest extends WebDriverRequest {
    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super(method, endpoint, body, isHubCommand)
        this.defaultAgents = agents
    }

    protected async _libRequest (url: URL, opts: Options.RequestLibOptions) {
        try {
            return (await got(url, opts as OptionsOfTextResponseBody)) as Options.RequestLibResponse
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
