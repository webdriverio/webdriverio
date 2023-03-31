import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isEqual test', () => {
    let browser: WebdriverIO.Browser
    let elem: any

    describe('web', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()
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
            // @ts-ignore remove command to make it fail
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
                    // @ts-ignore mock feature
                    mobileMode: true,
                    browserName: 'foobar'
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()
        })

        it('should return true if elements are equal', async () => {
            // @ts-ignore mock feature
            vi.mocked(got).setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elem)).toBe(true)
        })

        it('should return false if elements are NOT equal', async () => {
            const elements = await browser.$$('#bar')
            // @ts-ignore mock feature
            vi.mocked(got).setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elements[1])).toBe(false)
        })

        it('should call execute if in webview', async () => {
            // @ts-ignore mock feature
            vi.mocked(got).setMockResponse(['WEBVIEW'])
            const execute = browser.execute
            // @ts-ignore remove command to make it fail
            delete browser.execute
            browser.execute = vi.fn().mockReturnValue(true)

            expect(await elem.isEqual(elem)).toBe(true)
            expect(browser.execute).toBeCalled()

            // @ts-ignore remove command to make it fail
            delete browser.execute
            browser.execute = execute
        })
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
