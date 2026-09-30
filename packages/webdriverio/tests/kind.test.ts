import path from 'node:path'
import { inspect } from 'node:util'
import { describe, expect, test, vi } from 'vitest'

import { WDIO_KIND, WDIO_CHAINABLE, attach, multiRemote, remote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type Branded = { [WDIO_KIND]?: unknown, [WDIO_CHAINABLE]?: unknown }
const brandsOf = (value: unknown) => ({
    kind: (value as Branded)?.[WDIO_KIND],
    chainable: (value as Branded)?.[WDIO_CHAINABLE]
})
const resolved = (kind: string) => ({ kind, chainable: undefined })
const chainable = (kind: string) => ({ kind, chainable: true })

const multiRemoteCapabilities = {
    browserA: { capabilities: { browserName: 'chrome' } },
    browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
}

/**
 * The `wdio.kind` and `wdio.chainable` brands (#15812) on the objects that WebdriverIO creates.
 */
describe('WebdriverIO object brand', () => {
    test('exports the global symbols', () => {
        expect(WDIO_KIND).toBe(Symbol.for('wdio.kind'))
        expect(WDIO_CHAINABLE).toBe(Symbol.for('wdio.chainable'))
    })

    test('browser, elements and element arrays', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const element = await browser.$('#foo')
        const elements = await browser.$$('#foo')

        expect(brandsOf(browser)).toEqual(resolved('browser'))
        expect(brandsOf(element)).toEqual(resolved('element'))
        expect(brandsOf(elements)).toEqual(resolved('element-array'))
        expect(brandsOf(elements[0])).toEqual(resolved('element'))
        expect(brandsOf(await element.$('#bar'))).toEqual(resolved('element'))
        expect(brandsOf(await elements.filter(() => true))).toEqual(resolved('element-array'))
        expect(brandsOf([...elements])).toEqual({ kind: undefined, chainable: undefined })
    })

    test('an unresolved element is chainable', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })

        expect(brandsOf(browser.$('#foo'))).toEqual(chainable('element'))
        expect(brandsOf(browser.$('#foo').$('#bar'))).toEqual(chainable('element'))
        expect(brandsOf(browser.$('#foo').parentElement())).toEqual(chainable('element'))
        expect(brandsOf(browser.$$('#foo')[0])).toEqual(chainable('element'))
        expect(WDIO_CHAINABLE in browser.$('#foo')).toBe(true)
    })

    test('element lists have the same brand before and after they resolve, and are not chainable', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const pending = browser.$$('#foo')
        const chained = browser.$('#foo').$$('#bar')

        expect(brandsOf(pending)).toEqual(resolved('element-array'))
        expect(WDIO_KIND in pending).toBe(true)
        expect(WDIO_CHAINABLE in pending).toBe(false)
        expect(brandsOf(chained)).toEqual(resolved('element-array'))
        expect(brandsOf(await pending)).toEqual(resolved('element-array'))
        expect(brandsOf(await chained)).toEqual(resolved('element-array'))
    })

    test('the brand is not enumerable', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const element = await browser.$('#foo')

        expect(WDIO_KIND in element).toBe(true)
        expect(Object.getOwnPropertySymbols(element)
            .filter((symbol) => Object.getOwnPropertyDescriptor(element, symbol)?.enumerable)).not.toContain(WDIO_KIND)
        expect(JSON.stringify(element)).not.toContain('kind')
    })

    test('multi-remote objects have the same kinds, and isMultiRemote tells them apart', async () => {
        const browser = await multiRemote(multiRemoteCapabilities)
        const elements = await browser.$$('#foo')

        expect(brandsOf(browser)).toEqual(resolved('browser'))
        expect(brandsOf(browser.getInstance('browserA'))).toEqual(resolved('browser'))
        expect(brandsOf(browser.select('browserA'))).toEqual(resolved('browser'))
        expect(brandsOf(await browser.$('#foo'))).toEqual(resolved('element'))
        expect(brandsOf(elements)).toEqual(resolved('element-array'))
        expect(brandsOf(elements[0])).toEqual(resolved('element'))
        expect(brandsOf(browser.$('#foo'))).toEqual(chainable('element'))
        expect([browser.isMultiRemote, elements.isMultiRemote, elements[0].isMultiRemote]).toEqual([true, true, true])
    })

    test('a chained multi-remote list knows isMultiRemote before it loads', async () => {
        const browser = await multiRemote(multiRemoteCapabilities)
        const pendingLists = {
            'chained': browser.$('#foo').$$('#bar'),
            'nested': browser.$('#foo').$('#bar').$$('#baz'),
            'index on a pending list': browser.$$('#foo')[0].$$('#bar')
        }

        for (const [name, list] of Object.entries(pendingLists)) {
            expect({ name, ...brandsOf(list), isMultiRemote: list.isMultiRemote })
                .toEqual({ name, ...resolved('element-array'), isMultiRemote: true })
        }
        for (const list of Object.values(pendingLists)) {
            expect((await list).isMultiRemote).toBe(true)
        }
    })

    test('a chained single-session list stays single-session', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const list = browser.$('#foo').$$('#bar')

        expect(list.isMultiRemote).toBe(false)
        expect((await list).isMultiRemote).toBe(false)
    })
})

/**
 * Every way to create or pass on a WebdriverIO object, with its brands before and
 * after `await`. The `in` operator must agree with the brands on every row.
 */
describe('WebdriverIO object brand matrix', () => {
    /**
     * a loose view of the objects, so that a row can chain any command
     */
    interface Loose {
        (...args: unknown[]): Loose
        [key: string]: Loose
    }
    type Brands = { kind?: string, chainable?: true }
    interface Row {
        /**
         * the receiver of `make`, awaited first (default: the browser)
         */
        from?: (browser: Loose) => unknown
        make: (receiver: Loose) => unknown
        /**
         * the brands of the value that `make` returns, omitted when it is a promise of the test itself
         */
        pending?: Brands
        awaited: Brands | 'rejects'
        isMultiRemote?: boolean
    }

    const B: Brands = { kind: 'browser' }
    const E_CHAIN: Brands = { kind: 'element', chainable: true }
    const E: Brands = { kind: 'element' }
    const A: Brands = { kind: 'element-array' }
    const NONE: Brands = {}
    const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

    const isObject = (value: unknown): value is object => (
        value !== null && (typeof value === 'object' || typeof value === 'function')
    )
    const brandsOfValue = (value: unknown): Brands => {
        const brands = isObject(value) ? brandsOf(value) : { kind: undefined, chainable: undefined }
        return {
            ...(brands.kind === undefined ? {} : { kind: brands.kind as string }),
            ...(brands.chainable === undefined ? {} : { chainable: brands.chainable as true })
        }
    }
    const inOperator = (value: unknown) => isObject(value)
        ? { kind: WDIO_KIND in value, chainable: WDIO_CHAINABLE in value }
        : { kind: false, chainable: false }
    const expectedIn = (brands: Brands) => ({ kind: brands.kind !== undefined, chainable: brands.chainable === true })

    async function check (browser: Loose, row: Row) {
        const receiver = row.from ? await row.from(browser) as Loose : browser
        const value = row.make(receiver)
        if (row.pending) {
            expect({ brands: brandsOfValue(value), in: inOperator(value) })
                .toEqual({ brands: row.pending, in: expectedIn(row.pending) })
        }
        if (row.awaited === 'rejects') {
            await expect(Promise.resolve(value)).rejects.toThrow()
            return
        }
        const result = await value
        expect({ brands: brandsOfValue(result), in: inOperator(result) })
            .toEqual({ brands: row.awaited, in: expectedIn(row.awaited) })
        if (row.isMultiRemote !== undefined) {
            expect(Boolean((result as { isMultiRemote?: unknown }).isMultiRemote)).toBe(row.isMultiRemote)
        }
    }

    async function singleSession () {
        const browser = await remote({ waitforTimeout: 20, capabilities: { browserName: 'foobar' } })
        /**
         * the strategies run as a script, so they can not use `ELEMENT_KEY`
         */
        browser.addLocatorStrategy('one', () => ({ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' }) as unknown as HTMLElement)
        browser.addLocatorStrategy('many', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-456' }
        ] as unknown as HTMLElement[])
        browser.addCommand('firstFoo$', function (this: WebdriverIO.Browser) { return this.$('#foo') })
        browser.addCommand('allFoo$$', function (this: WebdriverIO.Browser) { return this.$$('#foo') })
        browser.addCommand('count$$', function () { return 42 })
        browser.addCommand('price$', function () { return 42 })
        browser.addCommand('getHeader', function (this: WebdriverIO.Browser) { return this.$('#foo') })
        browser.addCommand('allBar$$', function (this: WebdriverIO.Element) {
            return this.$$('#bar')
        }, { attachToElement: true })
        return browser as unknown as Loose
    }

    describe('single session: built-in queries', () => {
        test.each<[string, Row]>([
            ['#1 browser', { make: (b) => b, pending: B, awaited: B }],
            ['#2 attach()', { make: (b) => attach(b as unknown as WebdriverIO.Browser), awaited: B }],
            ['#3 $(s)', { make: (b) => b.$('#foo'), pending: E_CHAIN, awaited: E }],
            ['#4 $(elementReference)', { make: (b) => b.$({ [ELEMENT_KEY]: 'some-elem-123' }), pending: E_CHAIN, awaited: E }],
            ['#5 $(s) not found', { make: (b) => b.$('#nonexisting'), pending: E_CHAIN, awaited: E }],
            ['#6 $$(s)', { make: (b) => b.$$('#foo'), pending: A, awaited: A }],
            ['#7 $$([]) empty', { make: (b) => b.$$([]), pending: A, awaited: A }],
            ['#8 custom$', { make: (b) => b.custom$('one', 'x'), pending: E_CHAIN, awaited: E }],
            ['#8 custom$$', { make: (b) => b.custom$$('many', 'x'), pending: A, awaited: A }],
            ['#9 react$', { make: (b) => b.react$('MyComp'), pending: E_CHAIN, awaited: E }],
            ['#9 react$$', { make: (b) => b.react$$('MyComp'), pending: A, awaited: A }],
            ['#10 $(s).$(s2)', { make: (b) => b.$('#foo').$('#bar'), pending: E_CHAIN, awaited: E }],
            ['#10 $(s).$$(s2)', { make: (b) => b.$('#foo').$$('#bar'), pending: A, awaited: A }],
            ['#11 $(s).shadow$', { make: (b) => b.$('#foo').shadow$('#bar'), pending: E_CHAIN, awaited: E }],
            ['#11 $(s).shadow$$', { make: (b) => b.$('#foo').shadow$$('#bar'), pending: A, awaited: A }],
            ['#12 $(s).custom$', { make: (b) => b.$('#foo').custom$('one', 'x'), pending: E_CHAIN, awaited: E }],
            ['#12 $(s).custom$$', { make: (b) => b.$('#foo').custom$$('many', 'x'), pending: A, awaited: A }],
            ['#12 $(s).react$', { make: (b) => b.$('#foo').react$('MyComp'), pending: E_CHAIN, awaited: E }],
            ['#12 $(s).react$$', { make: (b) => b.$('#foo').react$$('MyComp'), pending: A, awaited: A }],
            ['#13 parentElement()', { make: (b) => b.$('#foo').$('#bar').parentElement(), pending: E_CHAIN, awaited: E }],
            ['#13 nextElement()', { make: (b) => b.$('#foo').nextElement(), pending: E_CHAIN, awaited: E }],
            ['#13 previousElement()', { make: (b) => b.$('#foo').$('#bar').previousElement(), pending: E_CHAIN, awaited: E }],
            ['#14 resolved element .$(s)', { from: (b) => b.$('#foo'), make: (el) => el.$('#bar'), pending: E_CHAIN, awaited: E }],
            ['#14 resolved element .parentElement()', { from: (b) => b.$('#foo').$('#bar'), make: (el) => el.parentElement(), pending: E_CHAIN, awaited: E }],
            ['#15 $$(s)[0]', { make: (b) => b.$$('#foo')[0], pending: E_CHAIN, awaited: E }],
            ['#15 $$(s).at(0)', { make: (b) => b.$$('#foo').at(0), pending: E_CHAIN, awaited: E }],
            ['#16 $$(s)[99] out of bounds', { make: (b) => b.$$('#foo')[99], pending: E_CHAIN, awaited: 'rejects' }],
            ['#17 $$(s)[0].$(s2)', { make: (b) => b.$$('#foo')[0].$('#bar'), pending: E_CHAIN, awaited: E }],
            ['#17 $$(s)[0].$$(s2)', { make: (b) => b.$$('#foo')[0].$$('#bar'), pending: A, awaited: A }],
            ['#18 $(s).$$(s2)[0]', { make: (b) => b.$('#foo').$$('#bar')[0], pending: E_CHAIN, awaited: E }],
            ['#19 $$(s).slice(0, 1)', { make: (b) => b.$$('#foo').slice(0, 1), pending: A, awaited: A }],
            ['#20 $$(s).filter(fn)', { make: (b) => b.$$('#foo').filter(() => true), pending: NONE, awaited: A }],
            ['#21 $$(s).map(fn)', { make: (b) => b.$$('#foo').map(() => 1), pending: NONE, awaited: NONE }],
            ['#22 $$(s).find(fn)', { make: (b) => b.$$('#foo').find(() => true), pending: NONE, awaited: E }],
            ['#23 $$(s).length', { make: (b) => b.$$('#foo').length, pending: NONE, awaited: NONE }],
            ['#24 for await item', {
                make: (b) => (async () => {
                    const items: unknown[] = []
                    for await (const item of b.$$('#foo') as unknown as AsyncIterable<unknown>) {
                        items.push(item)
                    }
                    return items[2]
                })(),
                awaited: E
            }],
            ['#25 (await $$(s))[0]', { from: (b) => b.$$('#foo'), make: (list) => list[0], pending: E, awaited: E }],
            ['#26 [...await $$(s)]', { from: (b) => b.$$('#foo'), make: (list) => [...(list as unknown as unknown[])], pending: NONE, awaited: NONE }],
            ['#27 $(s).getElement()', { make: (b) => b.$('#foo').getElement(), pending: NONE, awaited: E }],
            ['#27 $$(s).getElements()', { make: (b) => b.$$('#foo').getElements(), pending: NONE, awaited: A }],
            ['#28 getTitle()', { make: (b) => b.getTitle(), pending: NONE, awaited: NONE }],
            ['#28 $(s).getText()', { make: (b) => b.$('#foo').getTagName(), pending: NONE, awaited: NONE }],
            ['#29 action()', { make: (b) => b.action('pointer'), pending: NONE, awaited: NONE }],
            ['#30 execute() that returns an element reference', {
                make: (b) => b.execute(() => ({ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' })),
                pending: NONE,
                awaited: NONE
            }]
        ])('%s', async (_, row) => {
            await check(await singleSession(), row)
        })
    })

    describe('single session: custom and overwritten commands', () => {
        type Overwritable = {
            overwriteCommand: (name: string, fn: (orig: (...args: unknown[]) => unknown, ...args: unknown[]) => unknown) => void
        }
        test.each<[string, Row & { overwrite?: (browser: Overwritable) => void }]>([
            ['#31 custom firstFoo$', { make: (b) => b.firstFoo$(), pending: E_CHAIN, awaited: E }],
            ['#32 custom allFoo$$', { make: (b) => b.allFoo$$(), pending: A, awaited: A }],
            ['#33 custom element allBar$$ on a pending element', { make: (b) => b.$('#foo').allBar$$(), pending: A, awaited: A }],
            ['#34 custom element allBar$$ on a resolved element', { from: (b) => b.$('#foo'), make: (el) => el.allBar$$(), pending: A, awaited: A }],
            /**
             * the name of a custom command is the only hint before it resolves
             */
            ['#35 custom count$$ that returns a number', { make: (b) => b.count$$(), pending: A, awaited: NONE }],
            ['#36 custom price$ that returns a number', { make: (b) => b.price$(), pending: E_CHAIN, awaited: NONE }],
            /**
             * the index proxy of a value that is not an ElementArray does not know its item
             */
            ['#37 custom allFoo$$()[0]', { make: (b) => b.allFoo$$()[0], pending: NONE, awaited: E }],
            ['#38 custom allFoo$$().map(fn)', { make: (b) => b.allFoo$$().map(() => 1), pending: NONE, awaited: NONE }],
            ['#39 custom getHeader (no $ in the name)', { make: (b) => b.getHeader(), pending: NONE, awaited: E }],
            ['#40 overwriteCommand($)', {
                overwrite: (browser) => browser.overwriteCommand('$', (orig, ...args) => orig(...args)),
                make: (b) => b.$('#foo'),
                pending: E_CHAIN,
                awaited: E
            }],
            ['#41 overwriteCommand($$) that returns the list', {
                overwrite: (browser) => browser.overwriteCommand('$$', (orig, ...args) => orig(...args)),
                make: (b) => b.$$('#foo'),
                pending: A,
                awaited: A
            }],
            ['#41 overwriteCommand($$) async', {
                overwrite: (browser) => browser.overwriteCommand('$$', async (orig, ...args) => orig(...args)),
                make: (b) => b.$$('#foo'),
                pending: NONE,
                awaited: A
            }],
            ['#42 overwriteCommand($$) that returns a plain array', {
                overwrite: (browser) => browser.overwriteCommand('$$', () => []),
                make: (b) => b.$$('#foo'),
                pending: NONE,
                awaited: NONE
            }]
        ])('%s', async (_, row) => {
            const browser = await singleSession()
            row.overwrite?.(browser as unknown as Overwritable)
            await check(browser, row)
        })
    })

    describe('multi-remote', () => {
        test.each<[string, Row]>([
            ['#43 multi-remote browser', { make: (mr) => mr, pending: B, awaited: B, isMultiRemote: true }],
            ['#43 getInstance()', { make: (mr) => mr.getInstance('browserA'), pending: B, awaited: B, isMultiRemote: false }],
            /**
             * #44 (`mr.browserA`) exists only in the testrunner, see the multi-remote e2e test
             */
            ['#45 select()', { make: (mr) => mr.select('browserA'), pending: B, awaited: B, isMultiRemote: true }],
            ['#46 $(s)', { make: (mr) => mr.$('#foo'), pending: E_CHAIN, awaited: E, isMultiRemote: true }],
            ['#47 $$(s)', { make: (mr) => mr.$$('#foo'), pending: A, awaited: A, isMultiRemote: true }],
            ['#47 $(s).$$(s2)', { make: (mr) => mr.$('#foo').$$('#bar'), pending: A, awaited: A, isMultiRemote: true }],
            ['#48 $$(s)[0]', { make: (mr) => mr.$$('#foo')[0], pending: E_CHAIN, awaited: E, isMultiRemote: true }],
            ['#48 $$(s)[0].$$(s2)', { make: (mr) => mr.$$('#foo')[0].$$('#bar'), pending: A, awaited: A, isMultiRemote: true }],
            ['#49 element getInstance()', { from: (mr) => mr.$('#foo'), make: (el) => el.getInstance('browserA'), pending: E, awaited: E, isMultiRemote: false }],
            ['#50 element select()', { from: (mr) => mr.$('#foo'), make: (el) => el.select('browserA'), pending: E, awaited: E, isMultiRemote: true }],
            ['#51 getInstance().$(s)', { make: (mr) => mr.getInstance('browserA').$('#foo'), pending: E_CHAIN, awaited: E, isMultiRemote: false }],
            ['#52 custom allFoo$$', { make: (mr) => mr.allFoo$$(), pending: A, awaited: A, isMultiRemote: true }]
        ])('%s', async (_, row) => {
            const browser = await multiRemote(multiRemoteCapabilities)
            browser.addCommand('allFoo$$', function (this: WebdriverIO.MultiRemoteBrowser) { return this.$$('#foo') })
            await check(browser as unknown as Loose, row)
        })
    })

    test('#60 the brands are not in logs, snapshots or JSON', async () => {
        const browser = await singleSession()
        const values = {
            browser,
            element: await browser.$('#foo'),
            list: await browser.$$('#foo'),
            pendingList: browser.$$('#foo')
        }

        for (const [name, value] of Object.entries(values)) {
            const enumerable = Object.getOwnPropertySymbols(value)
                .filter((symbol) => Object.getOwnPropertyDescriptor(value, symbol)?.enumerable)
            expect({ name, enumerable }).toEqual({ name, enumerable: expect.not.arrayContaining([WDIO_KIND, WDIO_CHAINABLE]) })
            expect({ name, inspect: inspect(value).includes('wdio.') }).toEqual({ name, inspect: false })
        }
        expect(JSON.stringify(values.list)).not.toContain('element-array')
        expect(inspect(browser.$('#foo'))).not.toContain('wdio.')
    })
})
