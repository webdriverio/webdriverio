import { describe, it, expect } from 'vitest'

import { generateSpec, getterName, pageClassName } from '../../src/export/spec.js'
import type { HistoryEntry } from '../../src/types.js'

const step = (partial: Partial<HistoryEntry> & Pick<HistoryEntry, 'code'>): HistoryEntry => ({
    n: 1,
    time: '2026-01-01T00:00:00.000Z',
    kind: 'action',
    ...partial
})

describe('names', () => {
    it('names pages from the path', () => {
        expect(pageClassName('/cart.html')).toBe('Cart')
        expect(pageClassName('/')).toBe('Home')
        expect(pageClassName('/shop/my-orders')).toBe('MyOrders')
    })

    it('names getters from the accessible name or the selector', () => {
        expect(getterName('aria/Add to cart')).toBe('addToCart')
        expect(getterName('#email')).toBe('email')
        expect(getterName('[data-testid="add-blue"]')).toBe('addBlue')
        expect(getterName('button=Save')).toBe('save')
    })
})

describe('generateSpec', () => {
    const entries: HistoryEntry[] = [
        step({ n: 1, kind: 'open', code: "await browser.url('http://localhost:3000/cart.html')", path: '/cart.html' }),
        step({ n: 2, kind: 'action', code: "await $('[data-testid=\"add-blue\"]').click()", path: '/cart.html' }),
        step({ n: 3, kind: 'exec', code: "await expect($('aria/Checkout')).toBeDisplayed()", path: '/cart.html' }),
        step({ n: 4, kind: 'marker', code: '// restart' })
    ]

    it('writes a mocha spec with the steps and no refs', () => {
        const [spec] = generateSpec(entries, { title: 'cart' })
        expect(spec.contents).toContain("import { browser, $, expect } from '@wdio/globals'")
        expect(spec.contents).toContain("describe('cart'")
        expect(spec.contents).toContain("await browser.url('http://localhost:3000/cart.html')")
        expect(spec.contents).toContain("await $('[data-testid=\"add-blue\"]').click()")
        expect(spec.contents).toContain("await expect($('aria/Checkout')).toBeDisplayed()")
        expect(spec.contents).toContain('// restart')
        expect(spec.contents).not.toContain('ref(')
    })

    it('makes open URLs relative to baseUrl', () => {
        const [spec] = generateSpec(entries, { title: 'cart', baseUrl: 'http://localhost:3000' })
        expect(spec.contents).toContain("await browser.url('/cart.html')")
    })

    it('groups selectors into page objects', () => {
        const files = generateSpec(entries, { title: 'cart', pageObjects: true })
        const spec = files[0].contents
        const page = files.find((file) => file.path === 'pageobjects/Cart.page.ts')!.contents
        expect(spec).toContain("import CartPage from './pageobjects/Cart.page.ts'")
        expect(spec).toContain('const cart = new CartPage()')
        expect(spec).toContain('await cart.addBlue.click()')
        expect(spec).toContain('await expect(cart.checkout).toBeDisplayed()')
        expect(spec).not.toContain('ref(')
        expect(page).toContain('export default class CartPage')
        expect(page).toContain('get addBlue () { return $("[data-testid=\\"add-blue\\"]") }')
        expect(page).toContain('get checkout () { return $("aria/Checkout") }')
    })

    it('deduplicates getters on one page', () => {
        const files = generateSpec([
            step({ code: "await $('aria/Add to cart').click()\nawait $('button=Add to cart').click()", path: '/cart.html' })
        ], { title: 'cart', pageObjects: true })
        const page = files[1].contents
        expect(page).toContain('get addToCart ()')
        expect(page).toContain('get addToCart2 ()')
    })

    it('fails when a ref() call survived', () => {
        expect(() => generateSpec([step({ n: 4, kind: 'exec', code: "await ref('e5').click()" })], { title: 'x' }))
            .toThrow('Step 4 still contains ref().')
    })

    it('keeps the same structure for jasmine', () => {
        const [spec] = generateSpec(entries, { title: 'cart', framework: 'jasmine' })
        expect(spec.contents).toContain("describe('cart'")
        expect(spec.contents).toContain("it('cart'")
    })
})
