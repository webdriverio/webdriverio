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

describe('custom$', () => {
    let browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'devtools'
            }
        })

        browser.network.puppeteer = puppeteerMock
    })

    it('should enable the fetch domain if not already done', async () => {
        expect(clientMock.send).toBeCalledTimes(0)
        await browser.network.mock('/foobar')
        expect(clientMock.send).toBeCalledWith('Fetch.enable', expect.any(Object))
        expect(clientMock.on).toBeCalledWith('Fetch.requestPaused', expect.any(Function))

        await browser.network.mock('/foobar')
        expect(clientMock.send).toBeCalledTimes(1)
    })
})
