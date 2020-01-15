import got from 'got'
import { remote } from '../../../src'

describe('isEqual test', () => {
    let browser
    let elem

    describe('web', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()
        })

        it('should return true if elements are equal', async () => {
            expect(await elem.isEqual(elem)).toBe(true)
        })

        it('should return false if elements are NOT equal', async () => {
            const elements = await browser.$$('#bar')
            expect(await elem.isEqual(elements[1])).toBe(false)
        })

        it('should return false if execute command fails', async () => {
            const execute = browser.execute
            delete browser.execute
            expect(await elem.isEqual(elem)).toBe(false)
            browser.execute = execute
        })
    })

    describe('mobile', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    mobileMode: true,
                    browserName: 'foobar'
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()
        })

        it('should return true if elements are equal', async () => {
            got.setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elem)).toBe(true)
        })

        it('should return false if elements are NOT equal', async () => {
            const elements = await browser.$$('#bar')
            got.setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elements[1])).toBe(false)
        })

        it('should call execute if in webview', async () => {
            got.setMockResponse(['WEBVIEW'])
            const execute = browser.execute
            delete browser.execute
            browser.execute = jest.fn().mockReturnValue(true)

            expect(await elem.isEqual(elem)).toBe(true)
            expect(browser.execute).toBeCalled()

            delete browser.execute
            browser.execute = execute
        })
    })

    afterEach(() => {
        got.mockClear()
    })
})
