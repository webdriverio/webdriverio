import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const clientMock: any = {
    send: vi.fn(),
    on: vi.fn()
}
const pageMock: any = {
    target: vi.fn().mockReturnValue({
        createCDPSession: vi.fn().mockReturnValue(Promise.resolve(clientMock))
    }),
    evaluate: vi.fn().mockReturnValue(Promise.resolve(true))
}
const puppeteerMock: any = {
    pages: vi.fn().mockReturnValue([pageMock]),
    isConnected: vi.fn().mockReturnValue(true)
}

vi.mock('../../../src/utils/interception/webdriver', () => ({
    default: class {
        init = vi.fn()
    }
}))

describe('mock', () => {
    let browser: WebdriverIO.Browser
    beforeEach(async () => {
        clientMock.send.mockClear()
    })

    it('should enable the fetch domain if not already done', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })

        browser.puppeteer = puppeteerMock

        expect(clientMock.send).toBeCalledTimes(0)
        await browser.mock('/foobar')
        expect(clientMock.send).toBeCalledWith('Fetch.enable', expect.any(Object))
        expect(clientMock.on).toBeCalledWith('Fetch.requestPaused', expect.any(Function))

        await browser.mock('/foobar')
        expect(clientMock.send).toBeCalledTimes(1)
    })

    it('should mock on multiple tabs', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })

        browser.puppeteer = puppeteerMock

        // @ts-expect-error mock feature
        vi.mocked(got).setMockResponse('window-handle-2')
        expect(clientMock.send).toBeCalledTimes(0)
        await browser.mock('/foobar')
        expect(clientMock.send).toBeCalledTimes(1)
        expect(clientMock.send).toBeCalledWith('Fetch.enable', expect.any(Object))
        expect(clientMock.on).toBeCalledWith('Fetch.requestPaused', expect.any(Function))
        // @ts-expect-error mock feature
        vi.mocked(got).setMockResponse('window-handle-3')
        await browser.mock('/foobar')
        expect(clientMock.send).toBeCalledTimes(2)

    })

    it('should mock using WebDriver capabilities', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'chrome',
                'sauce:options': {
                    extendedDebugging: true
                }
            }
        })

        browser.puppeteer = puppeteerMock
        const mock = await browser.mock('/foobar')
        // @ts-expect-error mock feature
        expect(vi.mocked(mock.init)).toBeCalledWith()
    })
})
