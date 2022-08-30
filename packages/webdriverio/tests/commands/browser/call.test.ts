import { describe, it, expect, beforeAll, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('got')

describe('call command', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should call a fn and return result', async () => {
        const callFn = vi.fn(() => Promise.resolve(true))
        const result = await browser.call(callFn)
        expect(callFn).toBeCalled()
        expect(result).toEqual(true)
    })

    it('should not fail if nothing is applied', async () => {
        // @ts-ignore test invalid param
        await expect(() => browser.call())
            .rejects
            .toThrow(/needs to be a function/)
    })

    it('should fail if parameter is not a function', async () => {
        // @ts-ignore test invalid param
        await expect(() => browser.call(123))
            .rejects
            .toThrow(/needs to be a function/)
    })
})
