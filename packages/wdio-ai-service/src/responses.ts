import logger from '@wdio/logger'

import { isEffectRequest, isIgnored } from './effects.js'

const log = logger('@wdio/ai-service')

/**
 * responses kept, the oldest go first
 */
export const MAX_RESPONSES = 50
/**
 * bodies larger than this are not collected by the browser
 */
export const MAX_BODY_SIZE = 1_000_000

const TEXTUAL = /json|text\/|xml|graphql|csv/i

export interface CollectedResponse {
    request: string
    method: string
    url: string
    status: number
    mimeType: string
}

interface ResponseParams {
    navigation?: string | null
    request: { request: string, url: string, method: string, destination?: string, initiatorType?: string | null }
    response: { status: number, mimeType: string }
}

/**
 * The fetch and XHR responses with a text body the page received, collected
 * with a WebDriver BiDi network data collector, so `extract()` can read
 * values from the API the page shows only in part.
 */
export class ResponseLog {
    readonly #browser: WebdriverIO.Browser
    readonly #collector: string
    readonly #responses: CollectedResponse[] = []

    private constructor (browser: WebdriverIO.Browser, collector: string) {
        this.#browser = browser
        this.#collector = collector
    }

    /**
     * undefined on a Classic session or when the browser has no data
     * collectors
     */
    static async attach (browser: WebdriverIO.Browser, ignore: (string | RegExp)[]) {
        if (!(browser as unknown as { isBidi?: boolean }).isBidi) {
            return undefined
        }
        let collector: string
        try {
            ({ collector } = await browser.networkAddDataCollector({ dataTypes: ['response'], maxEncodedDataSize: MAX_BODY_SIZE }))
            await browser.sessionSubscribe({ events: ['network.responseCompleted'] })
        } catch (err) {
            log.debug(`the browser does not collect response bodies: ${(err as Error).message}`)
            return undefined
        }
        const responses = new ResponseLog(browser, collector)
        ;(browser.on as unknown as (event: string, handler: (params: ResponseParams) => void) => void).call(browser, 'network.responseCompleted', (params: ResponseParams) => {
            const { request, url, method, destination, initiatorType } = params.request
            if (!isEffectRequest({ url, destination, initiatorType, navigation: params.navigation }) || isIgnored(url, ignore) || !TEXTUAL.test(params.response.mimeType || '')) {
                return
            }
            responses.#add({ request, method, url, status: params.response.status, mimeType: params.response.mimeType })
        })
        return responses
    }

    get responses (): CollectedResponse[] {
        return [...this.#responses]
    }

    /**
     * the body as text, undefined when the browser no longer has it
     */
    async body (response: CollectedResponse): Promise<string | undefined> {
        try {
            const { bytes } = await this.#browser.networkGetData({ dataType: 'response', collector: this.#collector, request: response.request })
            return bytes.type === 'base64' ? Buffer.from(bytes.value, 'base64').toString('utf-8') : bytes.value
        } catch (err) {
            log.debug(`no body for ${response.method} ${response.url}: ${(err as Error).message}`)
            return undefined
        }
    }

    #add (response: CollectedResponse) {
        this.#responses.push(response)
        if (this.#responses.length > MAX_RESPONSES) {
            this.#responses.shift()
        }
    }
}
