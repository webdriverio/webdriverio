import path from 'node:path'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { remote, type ElementArray } from '../../src/index.js'

import * as getElem from '../../src/utils/getElementObject.js'

const origGetElem: typeof getElem = await vi.importActual('../../src/utils/getElementObject')

const ErrorExamplesW3C = {
    chrome: {
        error: 'no such element',
        message: 'no such element: No node with given id found\n  (Session info: headless chrome=116.0.5845.50)',
        stacktrace: '0   chromedriver                        0x000000010dc72288 chromedriver + 5014152\n' +
        '1   chromedriver                        0x000000010dc68fe3 chromedriver + 4976611\n' +
        '2   chromedriver                        0x000000010d80ddd7 chromedriver + 409047\n' +
        '3   chromedriver                        0x000000010d85cc19 chromedriver + 732185\n' +
        '4   chromedriver                        0x000000010d85cdd1 chromedriver + 732625\n' +
        '5   chromedriver                        0x000000010d8a2bd4 chromedriver + 1018836\n' +
        '6   chromedriver                        0x000000010d883f7d chromedriver + 892797\n' +
        '7   chromedriver                        0x000000010d89ffb1 chromedriver + 1007537\n' +
        '8   chromedriver                        0x000000010d883d23 chromedriver + 892195\n' +
        '9   chromedriver                        0x000000010d84e919 chromedriver + 674073\n' +
        '10  chromedriver                        0x000000010d84fb4e chromedriver + 678734\n' +
        '11  chromedriver                        0x000000010dc34669 chromedriver + 4761193\n' +
        '12  chromedriver                        0x000000010dc396e3 chromedriver + 4781795\n' +
        '13  chromedriver                        0x000000010dc404ae chromedriver + 4809902\n' +
        '14  chromedriver                        0x000000010dc3a40d chromedriver + 4785165\n' +
        '15  chromedriver                        0x000000010dc0cd9c chromedriver + 4599196\n' +
        '16  chromedriver                        0x000000010dc57ed8 chromedriver + 4906712\n' +
        '17  chromedriver                        0x000000010dc58090 chromedriver + 4907152\n' +
        '18  chromedriver                        0x000000010dc68c1e chromedriver + 4975646\n' +
        '19  libsystem_pthread.dylib             0x00007ff810a2b1d3 _pthread_start + 125\n' +
        '20  libsystem_pthread.dylib             0x00007ff810a26bd3 thread_start + 15\n'
    },
    firefox: {
        error: 'no such element',
        message: 'Unable to locate element: [role="example"]',
        stacktrace: 'RemoteError@chrome://remote/content/shared/RemoteError.sys.mjs:8:8\n' +
          'WebDriverError@chrome://remote/content/shared/webdriver/Errors.sys.mjs:188:5\n' +
          'NoSuchElementError@chrome://remote/content/shared/webdriver/Errors.sys.mjs:506:5\n' +
          'dom.find/</<@chrome://remote/content/shared/DOM.sys.mjs:132:16\n'
    }
}

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/commands/element/waitForExist', () => ({
    __esModule: true,
    waitForExist: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../../src/utils/getElementObject.js', async () => {

    const mod = {
        getElement: vi.fn(),
        getElements: vi.fn()
    }

    return { __esModule: true, ...mod, default: { ...mod } }
})

describe('getElements', () => {

    let browser: WebdriverIO.Browser

    beforeEach(async () => {

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(getElem.getElement).mockClear()
        vi.mocked(getElem.getElements).mockClear()

        vi.mocked(getElem.getElements).mockImplementation(
            (elem, _res, props) => origGetElem
                .getElements
                .call(browser, elem, ErrorExamplesW3C.chrome, props)
        )
    })

    it('should deal with a W3C spec error response', async () => {

        const error = new Error()
        Object.assign(error, {
            // name: ErrorExamplesW3C.chrome.error,
            message: ErrorExamplesW3C.chrome.message,
            stack: ErrorExamplesW3C.chrome.stacktrace,
        })

        const elems = await browser.$$('#foo')
        const [elem] = elems

        expect((elems as unknown as ElementArray).foundWith).toBe('$$')

        expect(elems).toHaveLength(1)

        const elemError = elem.error as Error
        expect(elemError).toBeInstanceOf(Error)
        expect(elemError.message).toEqual(error.message)
        expect(elemError.stack).toEqual(error.stack)
    })
})

describe('the items of a list', () => {
    it('share the wrapped commands of the list, and keep their own values (#16086)', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
        const items = origGetElem.getElements.call(browser, '#foo', [
            { 'element-6066-11e4-a52e-4f735466cecf': 'elem-a' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'elem-b' }
        ])
        expect(items[0].getText).toBe(items[1].getText)
        expect(Object.prototype.hasOwnProperty.call(items[0], 'getText')).toBe(false)
        expect(items.map((item) => [item.elementId, item.index, item.selector])).toEqual([['elem-a', 0, '#foo'], ['elem-b', 1, '#foo']])
    })

    it('is empty for an empty response', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
        expect(origGetElem.getElements.call(browser, '#foo', [])).toEqual([])
    })
})

describe('a single element', () => {
    const ref = (id: string) => ({ 'element-6066-11e4-a52e-4f735466cecf': id })

    it('shares the wrapped commands of the elements of the browser, and keeps its own values (#16422)', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
        const a = origGetElem.getElement.call(browser, '#a', ref('elem-a'))
        const b = origGetElem.getElement.call(browser, '#b', ref('elem-b'))
        const child = origGetElem.getElement.call(a, '.c', ref('elem-c'))
        const [item] = origGetElem.getElements.call(browser, '#d', [ref('elem-d')])
        expect(a.getText).toBe(b.getText)
        expect(child.getText).toBe(a.getText)
        expect(item.getText).toBe(a.getText)
        expect(Object.prototype.hasOwnProperty.call(a, 'getText')).toBe(false)
        expect([a, b, child].map((elem) => [elem.elementId, elem.selector, elem.parent])).toEqual([
            ['elem-a', '#a', browser], ['elem-b', '#b', browser], ['elem-c', '.c', a]
        ])
    })

    it('emits on its own parent', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
        const emitA = vi.fn()
        const emitB = vi.fn()
        const parentA = Object.create(browser, { emit: { value: emitA } })
        const parentB = Object.create(browser, { emit: { value: emitB } })
        const a = origGetElem.getElement.call(parentA, '#a', ref('elem-a'))
        const b = origGetElem.getElement.call(parentB, '#b', ref('elem-b'))
        expect(a.getText).toBe(b.getText)
        a.emit('custom', 'from a')
        b.emit('custom', 'from b')
        expect(emitA.mock.calls).toEqual([['custom', 'from a']])
        expect(emitA.mock.contexts).toEqual([parentA])
        expect(emitB.mock.calls).toEqual([['custom', 'from b']])
        expect(emitB.mock.contexts).toEqual([parentB])
        expect((a.__propertiesObject__.emit.value as Function)).not.toBe(b.__propertiesObject__.emit.value)
    })

    it('that was not found has the error and the commands', async () => {
        const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
        const error = new Error('no such element')
        const missing = origGetElem.getElement.call(browser, '#missing', error)
        const found = origGetElem.getElement.call(browser, '#found', ref('elem-found'))
        expect(missing.error).toBe(error)
        expect(missing.elementId).toBeUndefined()
        expect(missing.getText).toBe(found.getText)
        expect(found.error).toBeUndefined()
    })
})
