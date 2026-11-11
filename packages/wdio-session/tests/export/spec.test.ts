import path from 'node:path'
import vm from 'node:vm'

import { describe, it, expect } from 'vitest'

import { generateSpec, getterName, pageClassName, pageInstanceName } from '../../src/export/spec.js'
import { stripTypes } from '../../src/exec/transform.js'
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
        expect(pageClassName('/404.html')).toBe('Page404')
        expect(pageClassName('/new')).toBe('PageNew')
        expect(pageInstanceName('New')).toBe('newPage')
    })

    it('names getters from the accessible name or the selector', () => {
        expect(getterName('aria/Add to cart')).toBe('addToCart')
        expect(getterName('#email')).toBe('email')
        expect(getterName('[data-testid="add-blue"]')).toBe('addBlue')
        expect(getterName('button=Save')).toBe('save')
        expect(getterName('role/button[name="Add to cart"]')).toBe('addToCart')
        expect(getterName("role/link[name='Help']")).toBe('help')
        expect(getterName('role/button[name="Say \\"hi\\""]')).toBe('sayHi')
        expect(getterName('role/navigation')).toBe('navigation')
        expect(getterName('android=new UiSelector().resourceId("login_button")')).toBe('loginButton')
        expect(getterName('android=new UiSelector().text("Save").instance(1)')).toBe('save')
        expect(getterName('android=new UiSelector().description("go back")')).toBe('goBack')
        expect(getterName('id=login_button')).toBe('loginButton')
        expect(getterName('~Login')).toBe('login')
    })
})

/**
 * Runs a generated spec with stub globals, the way the test runner gives them through `@wdio/globals`.
 */
async function runSpec (contents: string, globals: Record<string, unknown>) {
    const results: unknown[] = []
    let pending: Promise<void> | undefined
    const source = contents.replace(/^import \{ (.+) \} from '@wdio\/globals'$/m, (_match, bindings: string) => (
        `const { ${bindings.replace(/\$\$ as (\w+)/g, (_alias, local: string) => `$$: ${local}`)} } = globals`
    ))
    // an ES module is strict, so the script is strict too
    vm.runInNewContext(`'use strict';\n${stripTypes(source)}`, {
        globals,
        results,
        describe: (_title: string, fn: () => void) => fn(),
        it: (_title: string, fn: () => Promise<void>) => { pending = fn() }
    })
    await pending
    return results
}

describe('generateSpec', () => {
    it.each([
        ["const select = $$; results.push((await select('a')).length)", 2],
        ["results.push((await $$.call(null, 'a')).length)", 2],
        ["const size: number = (await $$ /* comment */ ('a')).length; results.push(size)", 2],
        ["$$ = () => ['custom']; results.push($$()[0])", 'custom'],
        ["const saved = $$; $$ = (...args) => saved(...args); results.push((await $$('a')).length)", 2],
        ["$$ = null; $$ ||= () => ['fallback']; results.push($$()[0]); return", 'fallback'],
        ["let $$ = () => ['first']; $$ = () => ['local']; results.push($$()[0])", 'local'],
        ["function $$ () { return ['custom'] }; results.push($$()[0]); $$ = () => []", 'custom'],
        ["for ($$ of [() => ['loop']]) {} results.push($$()[0])", 'loop'],
        ["const __wdioDollarDollar = 'alias'; $$ = () => [__wdioDollarDollar]; results.push($$()[0])", 'alias']
    ])('replays selector reference: %s', async (code, expected) => {
        for (const pageObjects of [false, true]) {
            const [spec] = generateSpec([
                step({ kind: 'exec', code: String(code) })
            ], { title: 'selectors', pageObjects })
            const results = await runSpec(spec.contents, { browser: {}, $: () => {}, $$: async () => [1, 2], expect: () => {} })
            expect(results).toEqual([expected])
        }
    })

    it('preserves an explicitly declared local $$', async () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "const $$ = () => ['local']; results.push($$()[0])" })
        ], { title: 'local selector' })
        const results = await runSpec(spec.contents, { browser: {}, $: () => {}, $$: () => [], expect: () => {} })
        expect(results).toEqual(['local'])
    })

    it('keeps the steps flat when a step assigns $$ and no step declares its own', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: 'const saved = $$; $$ = (...args) => saved(...args)' }),
            step({ kind: 'exec', code: "await $$('a')" })
        ], { title: 'wrap' })
        expect(spec.contents).toContain('        var $$ = __wdioDollarDollar;\n\n        const saved = $$;')
        expect(spec.contents).toContain("\n        await $$('a')")
    })

    it('ends the $$ copy, so a first step that starts with ( is not a call', async () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "(await $$('a')).forEach((n) => results.push(n))" }),
            step({ kind: 'exec', code: '$$ = () => []' })
        ], { title: 'paren' })
        const results = await runSpec(spec.contents, { browser: {}, $: () => {}, $$: async () => [1, 2], expect: () => {} })
        expect(results).toEqual([1, 2])
    })

    it('puts the steps in a block when a TypeScript step that cannot be stripped assigns $$', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: 'const { $$ } = <any>{ $$: () => [] }' }),
            step({ kind: 'exec', code: '$$ = () => [1]' })
        ], { title: 'fallback' })
        expect(spec.contents).toContain('        {\n            const { $$ } = <any>')
    })

    it('puts the steps in a block when a step declares its own $$', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "await $$('a')" }),
            step({ kind: 'exec', code: 'let $$ = () => [1]; $$ = () => [2]' })
        ], { title: 'local' })
        expect(spec.contents).toContain("        var $$ = __wdioDollarDollar;\n\n        {\n            await $$('a')")
    })

    it.each([
        "await browser.$$('a')",
        "await $('ul').$$('li')",
        'const lookup = { $$: 1 }',
        'class Page { $$ () {} }',
        // stripTypes cannot remove an angle-bracket cast, so this step takes the text fallback
        "const n = <any>1; await browser.$$('a')"
    ])('does not import $$ for a member or a key named $$: %s', (code) => {
        const [spec] = generateSpec([step({ kind: 'exec', code })], { title: 'members' })
        expect(spec.contents).toContain("import { browser, $, expect } from '@wdio/globals'")
    })

    it.each([
        "(await $$('a'))[0].foo = 1",
        "const el = await $('ul'); el.$$ = await $$('li')",
        'for (const $$ of [() => []]) { $$() }',
        // stripTypes cannot remove an angle-bracket cast, so this step takes the text fallback
        'const n = <any>1; const pick = $$ => $$'
    ])('keeps the plain $$ import when a step does not assign the global $$: %s', (code) => {
        const [spec] = generateSpec([step({ kind: 'exec', code })], { title: 'reads' })
        expect(spec.contents).toContain("import { browser, $, $$, expect } from '@wdio/globals'")
        expect(spec.contents).not.toContain('__wdioDollarDollar')
        expect(spec.contents).not.toContain('var $$')
    })

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
        expect(spec.contents).toContain("it('cart'")
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

    it('never names a getter constructor, which a class cannot have', () => {
        const files = generateSpec([
            step({ code: "await $('android=new UiSelector().text(\"Constructor\")').click()\nawait $('aria/constructor').click()", path: '/cart.html' })
        ], { title: 'cart', pageObjects: true })
        const page = files[1].contents
        expect(page).not.toContain('get constructor ')
        expect(page).toContain('get elConstructor ()')
        expect(page).toContain('get elConstructor2 ()')
    })

    it('fails when a ref() call survived', () => {
        expect(() => generateSpec([step({ n: 4, kind: 'exec', code: "await ref('e5').click()" })], { title: 'x' }))
            .toThrow('Step 4 still contains ref().')
    })

    it.each([undefined, false, true])('hoists static imports out of the test and leaves strings and $$ alone (pageObjects: %s)', (pageObjects) => {
        const [spec] = generateSpec([
            step({
                kind: 'exec',
                code: [
                    "import os from 'node:os'",
                    "const note = \"await $('x').click()\"",
                    "await $$('a')",
                    'await $(selector).click()'
                ].join('\n')
            })
        ], { title: 'imports', pageObjects })
        const bodyAt = spec.contents.indexOf('async () => {')
        expect(spec.contents.indexOf("import os from 'node:os'")).toBeLessThan(bodyAt)
        expect(spec.contents.slice(bodyAt)).not.toContain("import os from 'node:os'")
        expect(spec.contents).toContain("const note = \"await $('x').click()\"")
        expect(spec.contents).toContain("await $$('a')")
        expect(spec.contents).toContain('await $(selector).click()')
        expect(spec.contents).toContain('import { browser, $, $$, expect }')
        expect(spec.contents).not.toContain('pageobjects/')
    })

    it('does not duplicate an existing $$ import', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "import { $$ } from '@wdio/globals'\nawait $$('a')" })
        ], { title: 'imports' })
        expect(spec.contents).toContain("import { browser, $, expect } from '@wdio/globals'")
        expect(spec.contents).toContain("import { $$ } from '@wdio/globals'")
    })

    it('imports $$ for a TypeScript step with a type annotation', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "const buttons: WebdriverIO.ElementArray = await $$ ('button')" })
        ], { title: 'buttons' })
        expect(spec.contents).toContain("import { browser, $, $$, expect } from '@wdio/globals'")
    })

    // stripTypes cannot remove an angle-bracket cast, so these steps take the text fallback
    it.each([
        "const n = <any>1; await $$ ('button')",
        'const n = <any>1; send(...$$)'
    ])('imports $$ from the text of a step that cannot be stripped: %s', (code) => {
        const [spec] = generateSpec([step({ kind: 'exec', code })], { title: 'text' })
        expect(spec.contents).toContain("import { browser, $, $$, expect } from '@wdio/globals'")
    })

    it('does not read a postfix update on the line before $$ as an assignment', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "const n = <any>1\nlet i = 0\ni++\n$$('a').length" })
        ], { title: 'postfix' })
        expect(spec.contents).toContain("import { browser, $, $$, expect } from '@wdio/globals'")
        expect(spec.contents).not.toContain('__wdioDollarDollar')
    })

    it('names a digit path as a valid page object', () => {
        const files = generateSpec([
            step({ code: "await $('h1').click()", path: '/404.html' })
        ], { title: 'missing', pageObjects: true })
        expect(files[0].contents).toContain('const page404 = new Page404Page()')
        expect(files[0].contents).toContain('await page404.h1.click()')
        expect(files[1].path).toBe('pageobjects/Page404.page.ts')
    })

    it('rewrites a relative import for the directory the spec is written to', () => {
        const [spec] = generateSpec([
            step({ kind: 'exec', code: "import { login } from './helpers/login.ts'\nawait login()\nawait import('./helpers/extra.ts')" })
        ], { title: 'login', cwd: path.resolve('proj'), outDir: path.resolve('proj', 'test', 'specs') })
        expect(spec.contents).toContain("from '../../helpers/login.ts'")
        expect(spec.contents).toContain("import('../../helpers/extra.ts')")
        expect(spec.contents).not.toContain("from './helpers/login.ts'")
    })
})
