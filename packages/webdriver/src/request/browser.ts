import { Options } from '@wdio/types'
import logger from '@wdio/logger'
import WebDriverRequest from './index'
import ky, { Options as KyOptions } from 'ky'

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

    protected _createOptions (options: RequestOptions, sessionId?: string): RequestLibOptions {
        return super._createOptions(options, sessionId, true)
    }

    protected async _libRequest (url: URL, options: RequestLibOptions) {
        const kyOptions: KyOptions = {}

        for (const opt of Object.keys(options) as Array<keyof RequestLibOptions>) {
            if (typeof options[opt] !== undefined &&
                UNSUPPORTED_OPTS.includes(opt) &&
                options[opt] !== this.defaultOptions[opt]) {
                log.info(`Browser-based webdriver does not support the '${String(opt)}' option; behavior may be unexpected`)
                continue
            }
            kyOptions[opt as keyof KyOptions] = options[opt]
        }

        if (options.username && options.password) {
            const encodedAuth = atob(`${options.username}:${options.password}`)
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
}
