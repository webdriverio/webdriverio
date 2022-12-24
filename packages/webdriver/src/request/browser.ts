import type { Options as KyOptions } from 'ky'
import ky from 'ky'
import logger from '@wdio/logger'
import type { Options } from '@wdio/types'

import WebDriverRequest from './index.js'

type RequestLibOptions = Options.RequestLibOptions
type RequestOptions = Omit<Options.WebDriver, 'capabilities'>

const log = logger('webdriver')

const UNSUPPORTED_OPTS: Array<keyof RequestLibOptions> = [
    'agent',
    'responseType',
    'searchParams',
]

export default class BrowserRequest extends WebDriverRequest {

    constructor (method: string, endpoint: string, body?: Record<string, unknown>, isHubCommand: boolean = false) {
        super(method, endpoint, body, isHubCommand)
    }

    protected async _createOptions (options: RequestOptions, sessionId?: string): Promise<RequestLibOptions> {
        return super._createOptions(options, sessionId, true)
    }

    protected async _libRequest (url: URL, options: RequestLibOptions) {
        const kyOptions: KyOptions = {}

        for (const opt of Object.keys(options) as Array<keyof RequestLibOptions>) {
            if (
                typeof options[opt] !== 'undefined' &&
                UNSUPPORTED_OPTS.includes(opt) &&
                options[opt] !== this.defaultOptions[opt]
            ) {
                log.info(`Browser-based webdriver does not support the '${String(opt)}' option; behavior may be unexpected`)
                continue
            }
            // @ts-expect-error
            kyOptions[opt] = options[opt]
        }

        if (options.username && options.password) {
            const encodedAuth = Buffer.from(`${options.username}:${options.password}`, 'utf8').toString('base64')
            kyOptions.headers = {
                ...kyOptions.headers,
                Authorization: `Basic ${encodedAuth}`
            }
        }

        const res = await ky(url, kyOptions)
        return {
            statusCode: res.status,
            body: await res.json(),
        }
    }

    protected _libPerformanceNow(): number {
        return performance.now()
    }
}
