import { describe, expect, it, vi } from 'vitest'

import { MAX_RESPONSES, ResponseLog } from '../src/responses.js'

function bidiBrowser ({ collectors = true } = {}) {
    const handlers = new Map<string, ((params: unknown) => void)[]>()
    const browser = {
        isBidi: true,
        networkAddDataCollector: vi.fn(async () => {
            if (!collectors) {
                throw new Error('unknown command')
            }
            return { collector: 'collector-1' }
        }),
        sessionSubscribe: vi.fn().mockResolvedValue(undefined),
        networkGetData: vi.fn(async ({ request }: { request: string }) => request === 'r-base64'
            ? { bytes: { type: 'base64', value: Buffer.from('{"total":42}').toString('base64') } }
            : { bytes: { type: 'string', value: `{"id":"${request}"}` } }),
        on (event: string, handler: (params: unknown) => void) {
            handlers.set(event, [...(handlers.get(event) || []), handler])
        }
    }
    const respond = (request: string, url: string, mimeType = 'application/json', extra: Record<string, unknown> = {}) => (handlers.get('network.responseCompleted') || []).forEach((handler) => handler({
        navigation: null,
        request: { request, url, method: 'GET', initiatorType: 'fetch', ...extra },
        response: { status: 200, mimeType }
    }))
    return { browser: browser as unknown as WebdriverIO.Browser & typeof browser, respond }
}

describe('ResponseLog', () => {
    it('is not attached on a Classic session or without data collectors', async () => {
        expect(await ResponseLog.attach({ isBidi: false } as unknown as WebdriverIO.Browser, [])).toBeUndefined()
        expect(await ResponseLog.attach(bidiBrowser({ collectors: false }).browser, [])).toBeUndefined()
    })

    it('keeps fetch and XHR responses with a text body, not documents, images or ignored hosts', async () => {
        const { browser, respond } = bidiBrowser()
        const log = (await ResponseLog.attach(browser, ['telemetry.example']))!
        expect(browser.networkAddDataCollector).toHaveBeenCalledWith({ dataTypes: ['response'], maxEncodedDataSize: 1_000_000 })
        expect(browser.sessionSubscribe).toHaveBeenCalledWith({ events: ['network.responseCompleted'] })

        respond('r1', 'https://shop.example/api/cart')
        respond('r2', 'https://shop.example/logo.png', 'image/png', { initiatorType: 'img' })
        respond('r3', 'https://shop.example/', 'text/html', { initiatorType: null, destination: 'document' })
        respond('r4', 'https://telemetry.example/collect')
        respond('r5', 'https://shop.example/api/report.csv', 'text/csv', { initiatorType: 'xmlhttprequest' })

        expect(log.responses.map((response) => response.request)).toEqual(['r1', 'r5'])
        expect(log.responses[0]).toEqual({ request: 'r1', method: 'GET', url: 'https://shop.example/api/cart', status: 200, mimeType: 'application/json' })
    })

    it('keeps the latest responses and reads string and base64 bodies', async () => {
        const { browser, respond } = bidiBrowser()
        const log = (await ResponseLog.attach(browser, []))!
        for (let i = 0; i <= MAX_RESPONSES; i++) {
            respond(`r${i}`, `https://shop.example/api/items/${i}`)
        }
        expect(log.responses).toHaveLength(MAX_RESPONSES)
        expect(log.responses[0].request).toBe('r1')

        expect(await log.body(log.responses[0])).toBe('{"id":"r1"}')
        expect(browser.networkGetData).toHaveBeenCalledWith({ dataType: 'response', collector: 'collector-1', request: 'r1' })
        expect(await log.body({ ...log.responses[0], request: 'r-base64' })).toBe('{"total":42}')
        browser.networkGetData.mockRejectedValueOnce(new Error('no such network data'))
        expect(await log.body(log.responses[1])).toBeUndefined()
    })
})
