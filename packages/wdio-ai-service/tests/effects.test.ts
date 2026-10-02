import { describe, expect, it } from 'vitest'

import {
    describeEffect, isEffectRequest, isIgnored, mergeEffects, missingEffects, resolveEffectsConfig,
    statusClass, urlTemplate, DEFAULT_IGNORE
} from '../src/effects.js'

describe('urlTemplate', () => {
    it('replaces id-like segments, drops the query and keeps a foreign host', () => {
        expect(urlTemplate('https://shop.example/api/cart/123?x=1', 'https://shop.example/products')).toBe('/api/cart/:id')
        expect(urlTemplate('https://shop.example/orders/3f2a9c1e-77aa-4b6c-9d1e-0b5a5c8e9f00', 'https://shop.example/')).toBe('/orders/:id')
        expect(urlTemplate('https://shop.example/files/a1b2c3d4e5f6', 'https://shop.example/')).toBe('/files/:id')
        expect(urlTemplate('https://api.payments.example/v1/charge', 'https://shop.example/')).toBe('api.payments.example/v1/charge')
        expect(urlTemplate('/products/blue-shirt', 'https://shop.example/')).toBe('/products/blue-shirt')
        expect(urlTemplate('about:blank', 'https://shop.example/')).toBe('about:blank')
    })
})

describe('requests', () => {
    it('groups status codes', () => {
        expect(statusClass(201)).toBe('2xx')
        expect(statusClass(404)).toBe('4xx')
        expect(statusClass(undefined, true)).toBe('failed')
    })

    it('keeps fetch and XHR calls and leaves out documents, assets, websockets and beacons', () => {
        expect(isEffectRequest({ url: 'https://shop.example/api/cart', initiatorType: 'fetch' })).toBe(true)
        expect(isEffectRequest({ url: 'https://shop.example/api/cart', initiatorType: 'xmlhttprequest' })).toBe(true)
        expect(isEffectRequest({ url: 'https://shop.example/collect', initiatorType: 'beacon' })).toBe(false)
        expect(isEffectRequest({ url: 'https://shop.example/logo.png', initiatorType: 'img' })).toBe(false)
        expect(isEffectRequest({ url: 'https://shop.example/next', navigation: 'nav-1' })).toBe(false)
        expect(isEffectRequest({ url: 'wss://shop.example/live' })).toBe(false)
        expect(isEffectRequest({ url: 'https://shop.example/app.js' })).toBe(false)
        expect(isEffectRequest({ url: 'https://shop.example/api/cart' })).toBe(true)
        expect(isEffectRequest({ url: 'https://shop.example/style.css', destination: 'style' })).toBe(false)
    })

    it('ignores analytics hosts and the patterns of the config', () => {
        const config = resolveEffectsConfig({ ignore: ['/telemetry', /\/beacon\//] })
        expect(config.mode).toBe('strict')
        expect(isIgnored('https://www.google-analytics.com/g/collect', config.ignore)).toBe(true)
        expect(isIgnored('https://shop.example/telemetry', config.ignore)).toBe(true)
        expect(isIgnored('https://shop.example/x/beacon/1', config.ignore)).toBe(true)
        expect(isIgnored('https://shop.example/api/cart', config.ignore)).toBe(false)
        expect(resolveEffectsConfig('loose')).toEqual({ mode: 'loose', ignore: DEFAULT_IGNORE })
    })
})

describe('missingEffects', () => {
    const recorded = { requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'], navigation: '/cart' }

    it('needs every part of the effect in strict mode, extra requests are fine', () => {
        expect(missingEffects(recorded, { ...recorded, requests: ['GET /api/stock → 2xx', 'POST /api/cart → 2xx'] }, 'strict')).toEqual([])
        expect(missingEffects(recorded, { requests: ['POST /api/wishlist → 2xx'], changed: ['status "Cart"'], navigation: '/cart' }, 'strict'))
            .toEqual(['POST /api/cart → 2xx'])
        expect(missingEffects(recorded, {}, 'strict')).toEqual(['navigation to /cart', 'POST /api/cart → 2xx', 'a change in status "Cart"'])
        expect(missingEffects({ opened: '/oauth', prompt: 'confirm' }, {}, 'strict')).toEqual(['a new window with /oauth', 'a confirm dialog'])
    })

    it('needs the navigation and one request or region in loose mode', () => {
        expect(missingEffects(recorded, { navigation: '/cart', changed: ['status "Cart"'] }, 'loose')).toEqual([])
        expect(missingEffects(recorded, { navigation: '/cart' }, 'loose')).toEqual(['one of POST /api/cart → 2xx, status "Cart"'])
        expect(missingEffects(recorded, { changed: ['status "Cart"'] }, 'loose')).toEqual(['navigation to /cart'])
    })

    it('checks nothing when off or when the step had no effect', () => {
        expect(missingEffects(recorded, {}, 'off')).toEqual([])
        expect(missingEffects(undefined, {}, 'strict')).toEqual([])
        expect(missingEffects({}, {}, 'strict')).toEqual([])
    })
})

describe('mergeEffects and describeEffect', () => {
    it('combines the effects of several steps', () => {
        expect(mergeEffects([
            { requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'] },
            undefined,
            { requests: ['GET /api/cart → 2xx', 'POST /api/cart → 2xx'], navigation: '/cart' }
        ])).toEqual({ requests: ['GET /api/cart → 2xx', 'POST /api/cart → 2xx'], changed: ['status "Cart"'], navigation: '/cart' })
        expect(describeEffect({ requests: ['POST /api/cart → 2xx'], changed: ['status "Cart"'], opened: '/help', prompt: 'alert' }))
            .toBe('POST /api/cart → 2xx, a new window with /help, a change in status "Cart", a alert dialog')
    })
})
