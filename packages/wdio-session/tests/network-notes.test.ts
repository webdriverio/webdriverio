import { describe, expect, it } from 'vitest'

import { failedRequestNote } from '../src/network-notes.js'
import type { NetworkEntry } from '../src/daemon/events.js'

let seq = 0
const entry = (over: Partial<NetworkEntry>): NetworkEntry => ({ seq: ++seq, time: 0, method: 'GET', url: 'https://shop.test/api', status: 200, failed: false, ...over })

describe('failedRequestNote', () => {
    it('names a failed XHR by status, method, host and path without the query', () => {
        const note = failedRequestNote([entry({ method: 'POST', url: 'https://algolia.shop.test/1/indexes/*/queries?x-key=secret', status: 403, resource: 'fetch' })])
        expect(note).toBe('Requests failed: 403 POST algolia.shop.test/1/indexes/*/queries')
    })

    it('counts identical requests', () => {
        const failed = entry({ method: 'POST', url: 'https://a.test/q', status: 403, resource: 'xmlhttprequest' })
        expect(failedRequestNote([failed, { ...failed, seq: ++seq }])).toBe('Requests failed: 403 POST a.test/q (×2)')
    })

    it('reports failed fetches and failed documents', () => {
        expect(failedRequestNote([
            entry({ url: 'http://127.0.0.1:9/nothing', failed: true, status: undefined, errorText: 'net::ERR_CONNECTION_REFUSED', resource: 'fetch' }),
            entry({ url: 'https://shop.test/missing', status: 404, resource: 'document' })
        ])).toBe('Requests failed: ERR GET 127.0.0.1:9/nothing\n                 404 GET shop.test/missing')
    })

    it('ignores images, fonts, scripts, beacons, trackers and aborted requests', () => {
        expect(failedRequestNote([
            entry({ url: 'https://cdn.test/logo.png', status: 404, resource: 'image' }),
            entry({ url: 'https://cdn.test/font.woff2', status: 404 }),
            entry({ url: 'https://cdn.test/app.js', status: 404, resource: 'script' }),
            entry({ url: 'https://stats.test/ping', status: 500, resource: 'beacon' }),
            entry({ url: 'https://www.google-analytics.com/g/collect', status: 403, resource: 'fetch' }),
            entry({ url: 'https://shop.test/api', failed: true, status: undefined, errorText: 'net::ERR_ABORTED', resource: 'fetch' })
        ])).toBeUndefined()
    })

    it('ignores successful and redirected requests', () => {
        expect(failedRequestNote([entry({ status: 200, resource: 'fetch' }), entry({ status: 304, resource: 'fetch' })])).toBeUndefined()
    })

    it('falls back to the URL when the resource is unknown', () => {
        expect(failedRequestNote([entry({ url: 'https://shop.test/api/cart', status: 500 })])).toBe('Requests failed: 500 GET shop.test/api/cart')
    })

    it('caps at three lines and counts the rest', () => {
        const note = failedRequestNote([1, 2, 3, 4, 5].map((n) => entry({ url: `https://shop.test/api/${n}`, status: 500, resource: 'fetch' })))
        expect(note?.split('\n').map((line) => line.trim())).toEqual([
            'Requests failed: 500 GET shop.test/api/1',
            '500 GET shop.test/api/2',
            '500 GET shop.test/api/3',
            '+2 more'
        ])
    })

    it('has no note without entries', () => {
        expect(failedRequestNote([])).toBeUndefined()
    })
})
