import http from 'node:http'
import https from 'node:https'
import { performance } from 'node:perf_hooks'
import type { URL } from 'node:url'

import got from 'got'
import type { Options } from '@wdio/types'

import WebDriverRequest, { RequestLibError } from './index.js'

const agents: Options.Agents = {
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}

export default class NodeJSRequest extends WebDriverRequest {
    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super(method, endpoint, body, isHubCommand)
        this.defaultAgents = agents
    }

    protected async _libRequest (url: URL, opts: Options.RequestLibOptions) {
        try {
            return (await got(url, opts)) as Options.RequestLibResponse
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
