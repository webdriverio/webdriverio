import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('waitForStable', () => {
    const timeout = 1000
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(got).mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        global.document = { visibilityState: 'visible' } as any
    })

    it('should use default waitFor options', async () => {
        const selector = '#foo'
        const tmpElem = await browser.$(selector)
        const elem = {
            waitForStable: tmpElem.waitForStable,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout },
            selector,
        } as any as WebdriverIO.Element

        await elem.waitForStable()
        expect(vi.mocked(elem.waitUntil).mock.calls[0][1]?.interval).toEqual(5)
        expect(vi.mocked(elem.waitUntil).mock.calls[0][1]?.timeout).toEqual(timeout)
        expect(vi.mocked(elem.waitUntil).mock.calls[0][1]?.timeoutMsg).toEqual(`element ("${selector}") still not stable after ${timeout}ms`)
    })

    it('should allow to set custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForStable: tmpElem.waitForStable,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        } as any as WebdriverIO.Element

        await elem.waitForStable({
            timeout,
            reverse: true,
            timeoutMsg: 'my custom error'
        })
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should throw when used on an inactive tab', async () => {
        global.document = { visibilityState: 'hidden' } as any
        const elem = await browser.$('#foo')
        await expect(elem.waitForStable()).rejects.toThrowError('You are are checking for animations on an inactive tab, animations do not run for inactive tabs')
    })

})
