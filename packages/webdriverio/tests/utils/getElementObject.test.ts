import path from 'node:path'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { remote } from '../../src/index.js'

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

vi.mock('got')
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
            name: ErrorExamplesW3C.chrome.error,
            message: ErrorExamplesW3C.chrome.message,
            stack: ErrorExamplesW3C.chrome.stacktrace,
        })

        const elems = await browser.$$('#foo')
        expect(elems).toHaveLength(1)
        expect(elems[0].error).toBeInstanceOf(Error)
        expect(elems[0]).toEqual(expect.objectContaining({ error }))
    })
})
