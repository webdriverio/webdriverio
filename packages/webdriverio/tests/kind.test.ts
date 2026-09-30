import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { WDIO_KIND, WDIO_CHAINABLE, multiRemote, remote } from '../src/index.js'

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
