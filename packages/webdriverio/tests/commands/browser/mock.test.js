import { remote } from '../../../src'

const clientMock = {
    send: jest.fn(),
    on: jest.fn()
}
const pageMock = {
    target: jest.fn().mockReturnValue({
        createCDPSession: jest.fn().mockReturnValue(Promise.resolve(clientMock))
    })
}
const puppeteerMock = {
    pages: jest.fn().mockReturnValue([pageMock])
}

jest.mock('../../../src/utils/interception/webdriver', () => class WebDriverInterceptionMock {
    constructor () {
        this.init = jest.fn()
    }
})

describe('custom$', () => {
    let browser

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

    it('should mock using WebDriver capabilities', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools',
                'sauce:options': {
                    extendedDebugging: true
                }
            }
        })

        browser.puppeteer = puppeteerMock
        const mock = await browser.mock('/foobar')
        expect(mock.init).toBeCalledWith()
    })
})
