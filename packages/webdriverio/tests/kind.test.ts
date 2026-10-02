import path from 'node:path'
import { inspect } from 'node:util'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { WDIO_KIND, WDIO_CHAINABLE, attach, multiRemote, remote } from '../src/index.js'
import refetchElement from '../src/utils/refetchElement.js'
import WebDriverInterception from '../src/utils/interception/index.js'
import { getBrowsingContext } from '../src/browsingContext.js'
import { isBrowsingContext } from '../src/session/browsingContext.js'
import { verifyArgsAndStripIfElement } from '../src/utils/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type Branded = { [WDIO_KIND]?: unknown, [WDIO_CHAINABLE]?: unknown }
const brandsOf = (value: unknown) => ({
    kind: (value as Branded)?.[WDIO_KIND],
    chainable: (value as Branded)?.[WDIO_CHAINABLE]
})
const resolved = (kind: string) => ({ kind, chainable: undefined })
const chainable = (kind: string) => ({ kind, chainable: true })
/**
 * the brands that are enumerable on `value` or on its prototypes (a mock has its brand on the prototype)
 */
const enumerableBrands = (value: object) => {
    const found: symbol[] = []
    for (let owner: object | null = value; owner; owner = Object.getPrototypeOf(owner)) {
        for (const symbol of [WDIO_KIND, WDIO_CHAINABLE]) {
            if (Object.getOwnPropertyDescriptor(owner, symbol)?.enumerable) {
                found.push(symbol)
            }
        }
    }
    return found
}

const multiRemoteCapabilities = {
    browserA: { capabilities: { browserName: 'chrome' } },
    browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
}

/**
 * a network mock on a browser that only answers the BiDi commands of `WebDriverInterception.initiate`
 */
const createMock = () => WebDriverInterception.initiate('http://foobar.com/api', {}, {
    options: {},
    on: vi.fn(),
    sessionSubscribe: vi.fn().mockResolvedValue(undefined),
    networkAddIntercept: vi.fn().mockResolvedValue({ intercept: '123' }),
    networkAddDataCollector: vi.fn().mockResolvedValue({ collector: '123' })
} as unknown as WebdriverIO.Browser)

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

    test('mocks have the kind mock, and isMultiRemote tells a multi-remote mock apart', async () => {
        const browser = await multiRemote({
            browserA: { capabilities: { browserName: 'bidi' } },
            browserB: { port: 4445, capabilities: { browserName: 'bidi' } }
        })
        /**
         * only the BiDi transport is stubbed, so `mock()` of each instance creates a real `WebDriverInterception`
         */
        for (const name of browser.instances) {
            const instance = browser.getInstance(name)
            vi.spyOn(instance, 'sessionSubscribe').mockResolvedValue(undefined as never)
            vi.spyOn(instance, 'networkAddIntercept').mockResolvedValue({ intercept: name } as never)
            vi.spyOn(instance, 'networkAddDataCollector').mockResolvedValue({ collector: name } as never)
        }
        const multiRemoteMock = await browser.mock('**/api')
        const instanceMocks = multiRemoteMock.instances.map((name) => multiRemoteMock.getInstance(name))

        expect(instanceMocks[0]).toBeInstanceOf(WebDriverInterception)
        expect(instanceMocks[0]).not.toBe(instanceMocks[1])
        expect(instanceMocks.map(brandsOf)).toEqual([resolved('mock'), resolved('mock')])
        expect(brandsOf(multiRemoteMock)).toEqual(resolved('mock'))
        expect([
            ...instanceMocks.map((mock) => Boolean((mock as { isMultiRemote?: boolean }).isMultiRemote)),
            multiRemoteMock.isMultiRemote
        ]).toEqual([false, false, true])
    })

    test('browsing contexts have their own kind, not the kind of the browser', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const tab = getBrowsingContext(browser, 'tab-1', { isFrame: false, url: 'https://webdriver.io' })
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'about:blank', parent: tab })

        expect(brandsOf(tab)).toEqual(resolved('browsing-context'))
        expect(brandsOf(frame)).toEqual(resolved('browsing-context'))
        expect(brandsOf(tab.browser)).toEqual(resolved('browser'))
        expect([isBrowsingContext(tab), isBrowsingContext(frame), isBrowsingContext(browser)]).toEqual([true, true, false])
        expect(isBrowsingContext({ contextId: 'tab-1', browser })).toBe(false)
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
         * before `await`: the rule of the contract (`@wdio/utils` `kind.ts`, rule 2) for a
         * promise, or the brands of a value that is already loaded (rule 1). Omitted when
         * it is a promise of the test itself.
         */
        pending?: PendingRule | Brands
        awaited: Brands | 'rejects'
        isMultiRemote?: boolean
        /**
         * the awaited element has an `error` (it was not found)
         */
        hasError?: boolean
    }

    const B: Brands = { kind: 'browser' }
    const E_CHAIN: Brands = { kind: 'element', chainable: true }
    const E: Brands = { kind: 'element' }
    const A: Brands = { kind: 'element-array' }
    const NONE: Brands = {}
    /**
     * rule 2 of the contract in `@wdio/utils` `kind.ts`: before `await`, the command name gives the brands
     */
    const PENDING_RULES = {
        'element query': E_CHAIN,
        'list item': E_CHAIN,
        'list query': A,
        'other promise': NONE
    } satisfies Record<string, Brands>
    type PendingRule = keyof typeof PENDING_RULES
    const pendingBrands = (row: Row) => typeof row.pending === 'string' ? PENDING_RULES[row.pending] : row.pending
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

    /**
     * Rules 3 and 4 of the contract in `@wdio/utils` `kind.ts`, for every row
     */
    function checkRules (row: Row) {
        const pending = pendingBrands(row)
        for (const brands of [pending, row.awaited]) {
            if (brands && brands !== 'rejects' && brands.chainable) {
                expect(brands.kind).toBe('element')
            }
        }
        if (row.awaited !== 'rejects') {
            expect(row.awaited.chainable).toBeUndefined()
            if (pending?.kind && row.awaited.kind) {
                expect(row.awaited.kind).toBe(pending.kind)
            }
        }
    }

    /**
     * The commands that read the brand accept exactly the values that the contract
     * gives the kind `'element'`: `switchFrame` a loaded or chainable element, and
     * `execute` (`verifyArgsAndStripIfElement`) a loaded element only.
     */
    async function checkConsumers (browser: Loose, value: unknown, brands: Brands, element: { elementId?: string, error?: unknown }) {
        const isElement = brands.kind === 'element'
        const stripped = (() => {
            try {
                return (verifyArgsAndStripIfElement([value]) as unknown[])[0]
            } catch (err) {
                return err
            }
        })()
        if (isElement && !brands.chainable) {
            expect(stripped).toEqual(element.elementId ? { [ELEMENT_KEY]: element.elementId } : expect.any(Error))
        } else {
            expect(stripped).toBe(value)
        }

        const webdriver = browser as unknown as WebdriverIO.Browser
        const switchToFrame = vi.spyOn(webdriver, 'switchToFrame')
        try {
            const switched = await webdriver.switchFrame(value as WebdriverIO.Element).then(() => true, () => false)
            const frames = switchToFrame.mock.calls.map(([frame]) => frame)
            if (isElement && element.elementId) {
                const frameRefs = frames.map((frame) => (frame as Record<string, unknown>)[ELEMENT_KEY])
                expect({ switched, frameRefs }).toEqual({ switched: true, frameRefs: [element.elementId] })
            } else if (!isElement) {
                /**
                 * any other value goes to WebDriver Classic `switchToFrame` as it is
                 */
                expect(frames.every((frame) => frame === value)).toBe(true)
            }
        } finally {
            switchToFrame.mockRestore()
        }
    }

    async function check (browser: Loose, row: Row) {
        checkRules(row)
        const pending = pendingBrands(row)
        const receiver = row.from ? await row.from(browser) as Loose : browser
        const value = row.make(receiver)
        if (pending) {
            expect({ brands: brandsOfValue(value), in: inOperator(value) })
                .toEqual({ brands: pending, in: expectedIn(pending) })
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
        if (row.hasError !== undefined) {
            expect(Boolean((result as { error?: unknown }).error)).toBe(row.hasError)
        }
        /**
         * `switchFrame` and `execute` run on a single session
         */
        if (!(browser as unknown as { isMultiRemote?: boolean }).isMultiRemote) {
            const element = (result ?? {}) as { elementId?: string, error?: unknown }
            if (pending) {
                await checkConsumers(browser, value, pending, element)
            }
            await checkConsumers(browser, result, row.awaited, element)
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
        browser.addCommand('getHeaders', function (this: WebdriverIO.Browser) { return this.$$('#foo') })
        browser.addCommand('boom$', function () { throw new Error('boom') })
        browser.addCommand('boomAsync$$', async function () { throw new Error('boomAsync') })
        browser.addCommand('allBar$$', function (this: WebdriverIO.Element) {
            return this.$$('#bar')
        }, { attachToElement: true })
        return browser as unknown as Loose
    }

    describe('single session: built-in queries', () => {
        test.each<[string, Row]>([
            ['#1 browser', { make: (b) => b, pending: B, awaited: B }],
            ['#2 attach()', { make: (b) => attach(b as unknown as WebdriverIO.Browser), awaited: B }],
            ['#3 $(s)', { make: (b) => b.$('#foo'), pending: 'element query', awaited: E }],
            ['#4 $(elementReference)', { make: (b) => b.$({ [ELEMENT_KEY]: 'some-elem-123' }), pending: 'element query', awaited: E }],
            ['#5 $(s) not found', { make: (b) => b.$('#nonexisting'), pending: 'element query', awaited: E, hasError: true }],
            ['#6 $$(s)', { make: (b) => b.$$('#foo'), pending: 'list query', awaited: A }],
            ['#7 $$([]) empty', { make: (b) => b.$$([]), pending: 'list query', awaited: A }],
            ['#8 custom$', { make: (b) => b.custom$('one', 'x'), pending: 'element query', awaited: E }],
            ['#8 custom$$', { make: (b) => b.custom$$('many', 'x'), pending: 'list query', awaited: A }],
            ['#9 react$', { make: (b) => b.react$('MyComp'), pending: 'element query', awaited: E }],
            ['#9 react$$', { make: (b) => b.react$$('MyComp'), pending: 'list query', awaited: A }],
            ['#10 $(s).$(s2)', { make: (b) => b.$('#foo').$('#bar'), pending: 'element query', awaited: E }],
            ['#10 $(s).$$(s2)', { make: (b) => b.$('#foo').$$('#bar'), pending: 'list query', awaited: A }],
            ['#11 $(s).shadow$', { make: (b) => b.$('#foo').shadow$('#bar'), pending: 'element query', awaited: E }],
            ['#11 $(s).shadow$$', { make: (b) => b.$('#foo').shadow$$('#bar'), pending: 'list query', awaited: A }],
            ['#12 $(s).custom$', { make: (b) => b.$('#foo').custom$('one', 'x'), pending: 'element query', awaited: E }],
            ['#12 $(s).custom$$', { make: (b) => b.$('#foo').custom$$('many', 'x'), pending: 'list query', awaited: A }],
            ['#12 $(s).react$', { make: (b) => b.$('#foo').react$('MyComp'), pending: 'element query', awaited: E }],
            ['#12 $(s).react$$', { make: (b) => b.$('#foo').react$$('MyComp'), pending: 'list query', awaited: A }],
            ['#13 parentElement()', { make: (b) => b.$('#foo').$('#bar').parentElement(), pending: 'element query', awaited: E }],
            ['#13 nextElement()', { make: (b) => b.$('#foo').nextElement(), pending: 'element query', awaited: E }],
            ['#13 previousElement()', { make: (b) => b.$('#foo').$('#bar').previousElement(), pending: 'element query', awaited: E }],
            ['#14 resolved element .$(s)', { from: (b) => b.$('#foo'), make: (el) => el.$('#bar'), pending: 'element query', awaited: E }],
            ['#14 resolved element .parentElement()', { from: (b) => b.$('#foo').$('#bar'), make: (el) => el.parentElement(), pending: 'element query', awaited: E }],
            ['#15 $$(s)[0]', { make: (b) => b.$$('#foo')[0], pending: 'list item', awaited: E }],
            ['#15 $$(s).at(0)', { make: (b) => b.$$('#foo').at(0), pending: 'list item', awaited: E }],
            ['#16 $$(s)[99] out of bounds', { make: (b) => b.$$('#foo')[99], pending: 'list item', awaited: 'rejects' }],
            ['#17 $$(s)[0].$(s2)', { make: (b) => b.$$('#foo')[0].$('#bar'), pending: 'element query', awaited: E }],
            ['#17 $$(s)[0].$$(s2)', { make: (b) => b.$$('#foo')[0].$$('#bar'), pending: 'list query', awaited: A }],
            ['#18 $(s).$$(s2)[0]', { make: (b) => b.$('#foo').$$('#bar')[0], pending: 'list item', awaited: E }],
            ['#19 $$(s).slice(0, 1)', { make: (b) => b.$$('#foo').slice(0, 1), pending: 'list query', awaited: A }],
            ['#20 $$(s).filter(fn)', { make: (b) => b.$$('#foo').filter(() => true), pending: 'other promise', awaited: A }],
            ['#21 $$(s).map(fn)', { make: (b) => b.$$('#foo').map(() => 1), pending: 'other promise', awaited: NONE }],
            ['#22 $$(s).find(fn)', { make: (b) => b.$$('#foo').find(() => true), pending: 'other promise', awaited: E }],
            ['#23 $$(s).length', { make: (b) => b.$$('#foo').length, pending: 'other promise', awaited: NONE }],
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
            /**
             * an index past the end of a resolved query waits and refetches, a derived list does not
             */
            ['#25 (await $$(s))[5] refetches', { from: (b) => b.$$('#foo'), make: (list) => list[5], pending: 'list item', awaited: 'rejects' }],
            ['#25 (await $$(s)).at(-1)', { from: (b) => b.$$('#foo'), make: (list) => list.at(-1), pending: E, awaited: E }],
            ['#25 (await $$(s).slice(0, 1))[5]', { from: (b) => b.$$('#foo').slice(0, 1), make: (list) => list[5], pending: NONE, awaited: NONE }],
            ['#26 [...await $$(s)]', { from: (b) => b.$$('#foo'), make: (list) => [...(list as unknown as unknown[])], pending: NONE, awaited: NONE }],
            ['#27 $(s).getElement()', { make: (b) => b.$('#foo').getElement(), pending: 'other promise', awaited: E }],
            ['#27 $$(s).getElements()', { make: (b) => b.$$('#foo').getElements(), pending: 'other promise', awaited: A }],
            ['#28 getTitle()', { make: (b) => b.getTitle(), pending: 'other promise', awaited: NONE }],
            ['#28 $(s).getText()', { make: (b) => b.$('#foo').getTagName(), pending: 'other promise', awaited: NONE }],
            ['#29 action()', { make: (b) => b.action('pointer'), pending: NONE, awaited: NONE }],
            ['#30 execute() that returns an element reference', {
                make: (b) => b.execute(() => ({ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' })),
                pending: 'other promise',
                awaited: NONE
            }],
            ['#78 custom$$()[0]', { make: (b) => b.custom$$('many', 'x')[0], pending: 'list item', awaited: E }],
            ['#78 react$$()[0]', { make: (b) => b.react$$('MyComp')[0], pending: 'list item', awaited: E }],
            ['#78 $(s).shadow$$(s2)[0]', { make: (b) => b.$('#foo').shadow$$('#bar')[0], pending: 'list item', awaited: E }],
            ['#79 $(s).$$(s2).at(-1)', { make: (b) => b.$('#foo').$$('#bar').at(-1), pending: 'list item', awaited: E }],
            ['#80 resolved element .$$(s)', { from: (b) => b.$('#foo'), make: (el) => el.$$('#bar'), pending: 'list query', awaited: A }],
            ['#81 $(element)', { from: (b) => b.$('#foo'), make: (el) => el.parent.$(el), pending: 'element query', awaited: E }],
            ['#81 $$(elementList)', { from: (b) => b.$$('#foo'), make: (list) => list.parent.$$(list), pending: 'list query', awaited: A }],
            ['#82 (await $$(s)).find(fn)', { from: (b) => b.$$('#foo'), make: (list) => list.find(() => true), pending: 'other promise', awaited: E }],
            ['#82 (await $$(s)).filter(fn)', { from: (b) => b.$$('#foo'), make: (list) => list.filter(() => true), pending: 'other promise', awaited: A }],
            ['#82 (await $$(s)).map(fn)', { from: (b) => b.$$('#foo'), make: (list) => list.map((el: unknown) => el), pending: 'other promise', awaited: NONE }]
        ])('%s', async (_, row) => {
            await check(await singleSession(), row)
        })
    })

    /**
     * Before `await` the brand comes from the command name only, so a failed query has the
     * same brand as a found one. A not-found element is still an element (with `error`), and
     * a query that fails rejects, so there is no object to brand.
     */
    describe('single session: errors', () => {
        test.each<[string, Row]>([
            /**
             * the fetch mock finds a child of a not-found element, so only the brands are relevant here
             */
            ['#63 $(s).$(s2) on a not-found element', { make: (b) => b.$('#nonexisting').$('#bar'), pending: 'element query', awaited: E }],
            ['#64 $(s).$$(s2) on a not-found element', { make: (b) => b.$('#nonexisting').$$('#bar'), pending: 'list query', awaited: A }],
            ['#65 parentElement() of a not-found element', {
                make: (b) => b.$('#nonexisting').parentElement(),
                pending: 'element query',
                awaited: E,
                hasError: true
            }],
            ['#66 a command on a not-found element', { make: (b) => b.$('#nonexisting').getTagName(), pending: 'other promise', awaited: 'rejects' }],
            ['#67 custom$ with an unknown strategy', { make: (b) => b.custom$('nope', 'x'), pending: 'element query', awaited: 'rejects' }],
            ['#68 custom$$ with an unknown strategy', { make: (b) => b.custom$$('nope', 'x'), pending: 'list query', awaited: 'rejects' }],
            ['#69 react$ of a not-found component', { make: (b) => b.react$('myNonExistingComp'), pending: 'element query', awaited: E, hasError: true }],
            ['#70 custom boom$ that throws', { make: (b) => b.boom$(), pending: 'element query', awaited: 'rejects' }],
            ['#71 custom boomAsync$$ that rejects', { make: (b) => b.boomAsync$$(), pending: 'list query', awaited: 'rejects' }]
        ])('%s', async (_, row) => {
            await check(await singleSession(), row)
        })

        test('#73 an unknown multi-remote instance throws, and returns no object', async () => {
            const browser = await multiRemote(multiRemoteCapabilities)

            expect(() => browser.getInstance('nope')).toThrow('Multi-remote object has no instance named "nope"')
            expect(() => browser.select('nope')).toThrow('None of the following requested instances are valid: nope')
        })
    })

    /**
     * A command on a stale element refetches the element and its parents, then copies
     * `elementId` and `parent` into the same object (see `middlewares.ts`).
     */
    describe('stale elements', () => {
        const staleMock = fetch as unknown as { retryCnt: number }
        const parentOf = (value: unknown) => (value as { parent?: unknown }).parent
        beforeEach(() => {
            staleMock.retryCnt = 0
        })
        afterEach(() => {
            staleMock.retryCnt = 0
        })

        test('#74 a stale element keeps its brand after the refetch, and so does its new parent', async () => {
            const browser = await remote({ waitforTimeout: 20, capabilities: { browserName: 'foobar' } })
            const element = await (await (await browser.$('#foo')).$('#subfoo')).$('#subsubfoo')
            const parentBefore = element.parent

            /**
             * the fetch mock answers the first click on this element with "stale element reference"
             */
            expect(await element.click()).toBeNull()
            expect(element.parent).not.toBe(parentBefore)
            expect({ element: brandsOf(element), inChainable: WDIO_CHAINABLE in element }).toEqual({ element: resolved('element'), inChainable: false })
            expect(brandsOf(element.parent)).toEqual(resolved('element'))
            expect(brandsOf(parentOf(element.parent))).toEqual(resolved('element'))
            expect(brandsOf(parentOf(parentOf(element.parent)))).toEqual(resolved('browser'))
        })

        test('#75 a stale element in a pending chain is chainable, and its command succeeds', async () => {
            const browser = await remote({ waitforTimeout: 20, capabilities: { browserName: 'foobar' } })
            const chain = browser.$('#foo').$('#subfoo').$('#subsubfoo')

            expect(brandsOf(chain)).toEqual(chainable('element'))
            expect(await chain.click()).toBeNull()
            expect(brandsOf(await chain)).toEqual(resolved('element'))
        })

        test('#76 refetchElement() returns branded elements, for an element and for a list item', async () => {
            const browser = await remote({ waitforTimeout: 20, capabilities: { browserName: 'foobar' } })
            const element = await (await browser.$('#foo')).$('#subfoo') as unknown as WebdriverIO.Element
            const item = (await browser.$$('#foo'))[1]

            const refetched = await refetchElement(element, 'click')
            expect(brandsOf(refetched)).toEqual(resolved('element'))
            expect(brandsOf(refetched.parent)).toEqual(resolved('element'))
            expect(brandsOf(parentOf(refetched.parent))).toEqual(resolved('browser'))

            const refetchedItem = await refetchElement(item, 'click')
            expect({ ...brandsOf(refetchedItem), elementId: refetchedItem.elementId, index: refetchedItem.index })
                .toEqual({ ...resolved('element'), elementId: 'some-elem-456', index: 1 })
            expect(brandsOf(refetchedItem.parent)).toEqual(resolved('browser'))
        })

        test('#77 a refetch that finds no element rejects, and returns no object', async () => {
            const browser = await remote({ waitforTimeout: 20, capabilities: { browserName: 'foobar' } })
            const item = (await browser.$$('#foo'))[2]
            item.index = 5

            await expect(refetchElement(item, 'click')).rejects.toThrow()
        })
    })

    describe('single session: custom and overwritten commands', () => {
        type Overwritable = {
            overwriteCommand: (name: string, fn: (orig: (...args: unknown[]) => unknown, ...args: unknown[]) => unknown) => void
        }
        test.each<[string, Row & { overwrite?: (browser: Overwritable) => void }]>([
            ['#31 custom firstFoo$', { make: (b) => b.firstFoo$(), pending: 'element query', awaited: E }],
            ['#32 custom allFoo$$', { make: (b) => b.allFoo$$(), pending: 'list query', awaited: A }],
            ['#33 custom element allBar$$ on a pending element', { make: (b) => b.$('#foo').allBar$$(), pending: 'list query', awaited: A }],
            ['#34 custom element allBar$$ on a resolved element', { from: (b) => b.$('#foo'), make: (el) => el.allBar$$(), pending: 'list query', awaited: A }],
            /**
             * the name of a custom command is the only hint before it resolves
             */
            ['#35 custom count$$ that returns a number', { make: (b) => b.count$$(), pending: 'list query', awaited: NONE }],
            ['#36 custom price$ that returns a number', { make: (b) => b.price$(), pending: 'element query', awaited: NONE }],
            /**
             * an item of a pending custom `$$` is a chainable element, so `switchFrame` accepts it
             */
            ['#37 custom allFoo$$()[0]', { make: (b) => b.allFoo$$()[0], pending: 'list item', awaited: E }],
            ['#38 custom allFoo$$().map(fn)', { make: (b) => b.allFoo$$().map(() => 1), pending: 'other promise', awaited: NONE }],
            ['#39 custom getHeader (no $ in the name)', { make: (b) => b.getHeader(), pending: 'other promise', awaited: E }],
            ['#83 custom allFoo$$().at(0)', { make: (b) => b.allFoo$$().at(0), pending: 'list item', awaited: E }],
            ['#83 custom allFoo$$().find(fn)', { make: (b) => b.allFoo$$().find(() => true), pending: 'other promise', awaited: E }],
            ['#83 custom allFoo$$()[0].$(s)', { make: (b) => b.allFoo$$()[0].$('#bar'), pending: 'element query', awaited: E }],
            ['#84 custom element allBar$$ on a pending element, [0]', { make: (b) => b.$('#foo').allBar$$()[0], pending: 'list item', awaited: E }],
            /**
             * without `$$` at the end the command gives a plain promise, which has no index
             */
            ['#85 custom getHeaders()[0] (no $$ in the name)', { make: (b) => b.getHeaders()[0], pending: NONE, awaited: NONE }],
            ['#40 overwriteCommand($)', {
                overwrite: (browser) => browser.overwriteCommand('$', (orig, ...args) => orig(...args)),
                make: (b) => b.$('#foo'),
                pending: 'element query',
                awaited: E
            }],
            ['#41 overwriteCommand($$) that returns the list', {
                overwrite: (browser) => browser.overwriteCommand('$$', (orig, ...args) => orig(...args)),
                make: (b) => b.$$('#foo'),
                pending: 'list query',
                awaited: A
            }],
            ['#41 overwriteCommand($$) async', {
                overwrite: (browser) => browser.overwriteCommand('$$', async (orig, ...args) => orig(...args)),
                make: (b) => b.$$('#foo'),
                pending: 'list query',
                awaited: A
            }],
            /**
             * the command gives its value at once, so the value decides (rule 1), not the name
             */
            ['#86 overwriteCommand($$) async, [0]', {
                overwrite: (browser) => browser.overwriteCommand('$$', async (orig, ...args) => orig(...args)),
                make: (b) => b.$$('#foo')[0],
                pending: 'list item',
                awaited: E
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
            ['#46 $(s)', { make: (mr) => mr.$('#foo'), pending: 'element query', awaited: E, isMultiRemote: true }],
            ['#47 $$(s)', { make: (mr) => mr.$$('#foo'), pending: 'list query', awaited: A, isMultiRemote: true }],
            ['#47 $(s).$$(s2)', { make: (mr) => mr.$('#foo').$$('#bar'), pending: 'list query', awaited: A, isMultiRemote: true }],
            ['#48 $$(s)[0]', { make: (mr) => mr.$$('#foo')[0], pending: 'list item', awaited: E, isMultiRemote: true }],
            ['#48 $$(s)[0].$$(s2)', { make: (mr) => mr.$$('#foo')[0].$$('#bar'), pending: 'list query', awaited: A, isMultiRemote: true }],
            ['#49 element getInstance()', { from: (mr) => mr.$('#foo'), make: (el) => el.getInstance('browserA'), pending: E, awaited: E, isMultiRemote: false }],
            ['#50 element select()', { from: (mr) => mr.$('#foo'), make: (el) => el.select('browserA'), pending: E, awaited: E, isMultiRemote: true }],
            ['#51 getInstance().$(s)', { make: (mr) => mr.getInstance('browserA').$('#foo'), pending: 'element query', awaited: E, isMultiRemote: false }],
            ['#52 custom allFoo$$', { make: (mr) => mr.allFoo$$(), pending: 'list query', awaited: A, isMultiRemote: true }],
            ['#87 custom allFoo$$()[0]', { make: (mr) => mr.allFoo$$()[0], pending: 'list item', awaited: E, isMultiRemote: true }],
            ['#87 custom allFoo$$().at(0)', { make: (mr) => mr.allFoo$$().at(0), pending: 'list item', awaited: E, isMultiRemote: true }],
            ['#72 $(s) not found', { make: (mr) => mr.$('#nonexisting'), pending: 'element query', awaited: E, isMultiRemote: true }]
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
            pendingList: browser.$$('#foo'),
            chainable: browser.$('#foo'),
            mock: await createMock(),
            context: getBrowsingContext(browser as unknown as WebdriverIO.Browser, 'tab-1', { isFrame: false, url: 'https://webdriver.io' })
        }

        for (const [name, value] of Object.entries(values)) {
            expect({ name, branded: brandsOf(value).kind !== undefined }).toEqual({ name, branded: true })
            expect({ name, enumerable: enumerableBrands(value) }).toEqual({ name, enumerable: [] })
            expect({ name, inspect: inspect(value).includes('wdio.') }).toEqual({ name, inspect: false })
        }
        expect(JSON.stringify(values.list)).not.toContain('element-array')
        expect(inspect(browser.$('#foo'))).not.toContain('wdio.')
    })
})
