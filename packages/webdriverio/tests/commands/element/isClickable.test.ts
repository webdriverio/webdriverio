import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isClickable test', () => {
    let browser: WebdriverIO.Browser
    let elem: any

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
        vi.mocked(fetch).mockClear()
    })

    it('should allow to check if element is clickable', async () => {
        await elem.isClickable()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as any).args[0]).toEqual({
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            ELEMENT: 'some-elem-123'
        })
    })

    it('should return false if element can\'t be found after refetching it', async () => {
        const elem = await browser.$('#nonexisting')
        expect(await elem.isClickable()).toBe(false)
        expect(fetch).toBeCalledTimes(2)
    })

    it('should throw if in mobile native context', async () => {
        const scope = {
            isDisplayed: vi.fn().mockResolvedValue(true),
            execute: vi.fn(),
            options: {},
            isMobile: true,
            isNativeContext: true
        }
        await expect(() => elem.isClickable.call(scope)).rejects.toThrow()
    })

    it('should not throw if getContext fails', async () => {
        const scope = {
            isDisplayed: vi.fn().mockResolvedValue(true),
            execute: vi.fn(),
            options: {},
            isMobile: true,
            getContext: vi.fn().mockRejectedValue(new Error('command does not exist'))
        }
        await elem.isClickable.call(scope)
        expect(scope.execute).toBeCalledTimes(1)
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
