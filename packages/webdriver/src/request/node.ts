import http from 'http'
import https from 'https'

import * as got from 'got'
import type { URL } from 'url'
import { Options } from '@wdio/types'
import WebDriverRequest, { RequestLibError } from './index'
import { performance } from 'perf_hooks'

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
            return (await got.default(url, opts as got.Options)) as Options.RequestLibResponse
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
