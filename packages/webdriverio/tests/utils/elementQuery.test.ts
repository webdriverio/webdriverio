import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
import { WDIO_QUERY, setWdioKind } from '@wdio/utils'

import { remote } from '../../src/index.js'
import { elementQuery, listQuery, tagQuery } from '../../src/utils/elementQuery.js'
import { REACT_OPTIONS } from '../../src/utils/findElementAgain.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const host = { [WDIO_QUERY]: '$(`#host`)' }

describe('elementQuery', () => {
    it('writes each query command as in the test code, after the query of its parent', () => {
        expect(elementQuery({ selector: '#btn', parent: {} })).toBe('$(`#btn`)')
        expect(elementQuery({ selector: 'input[name="email"]', parent: host, isShadowElement: true })).toBe('$(`#host`).shadow$(`input[name="email"]`)')
        expect(elementQuery({ selector: 'li', parent: host, index: 2 })).toBe('$(`#host`).$$(`li`)[2]')
        expect(elementQuery({ selector: 'MyComp', parent: {}, isReactElement: true, [REACT_OPTIONS]: { props: { id: 1 }, state: {} } })).toBe('react$(`MyComp`, {"props":{"id":1}})')
        expect(elementQuery({ selector: 'MyComp', parent: {}, isReactElement: true, index: 0 })).toBe('react$$(`MyComp`)[0]')
    })

    it('writes a custom strategy with its arguments, without the element that it runs in', () => {
        const parent = setWdioKind({}, 'element')
        const selector = { strategy: () => null, strategyName: 'byTestId', strategyArguments: ['name', parent] }
        expect(elementQuery({ selector, parent: host })).toBe('$(`#host`).custom$(`byTestId`, "name")')
        expect(elementQuery({ selector, parent: host, index: 1 })).toBe('$(`#host`).custom$$(`byTestId`, "name")[1]')
    })

    it('writes the query of a function selector', () => {
        expect(elementQuery({ selector: function nextElement () { return null }, parent: host })).toBe('$(`#host`).nextElement()')
        expect(elementQuery({ selector: tagQuery(() => null, 'shadow$', ['#x']), parent: host })).toBe('$(`#host`).shadow$(`#x`)')
        expect(elementQuery({ selector: tagQuery(() => null, 'shadow$$', ['#x']), parent: host, index: 3 })).toBe('$(`#host`).shadow$$(`#x`)[3]')
        expect(elementQuery({ selector: () => null, parent: {} })).toBe('$(`<fn>`)')
    })

    it('writes an element list with its query and its arguments', () => {
        expect(listQuery({ parent: host, foundWith: '$$', selector: 'li' })).toBe('$(`#host`).$$(`li`)')
        expect(listQuery({ parent: {}, foundWith: 'custom$$', selector: 'byTestId', props: ['menu'] })).toBe('custom$$(`byTestId`, "menu")')
    })

    it('gives an awaited element, an element list and its items their query', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const elem = await browser.$('#foo').$('#subfoo')
        expect((elem as unknown as Record<symbol, unknown>)[WDIO_QUERY]).toBe('$(`#foo`).$(`#subfoo`)')
        const list = await browser.$$('.foo')
        expect((list as unknown as Record<symbol, unknown>)[WDIO_QUERY]).toBe('$$(`.foo`)')
        expect((list[1] as unknown as Record<symbol, unknown>)[WDIO_QUERY]).toBe('$$(`.foo`)[1]')
        expect((browser.$$('.foo')[2] as unknown as Record<symbol, unknown>)[WDIO_QUERY]).toBe('$$(`.foo`)[2]')
    })
})
