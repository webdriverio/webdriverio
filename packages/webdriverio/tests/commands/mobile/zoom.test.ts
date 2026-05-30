import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { calculateAndroidPinchAndZoomSpeed, validatePinchAndZoomOptions } from '../../../src/utils/mobile.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock(import('../../../src/utils/mobile.js'), async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        calculateAndroidPinchAndZoomSpeed: vi.fn(),
        validatePinchAndZoomOptions: vi.fn(),
    }
})

describe('zoom test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        // @ts-expect-error
        elem = await browser.$('#foo')
        await expect(elem.zoom()).rejects.toThrow('The zoom command is only available for mobile platforms.')
    })

    it('should execute a zoom for iOS with the correct values', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        // @ts-expect-error
        elem = await browser.$('#foo')
        // @ts-expect-error mock feature
        elem.elementId = { pinch: 'mockFunction'  }
        vi.mocked(validatePinchAndZoomOptions).mockReturnValue({
            duration: 1500,
            scale: 8
        })

        await elem.zoom()

        const { calls } = vi.mocked(fetch).mock
        expect(calls).toHaveLength(3)
        const [[sessionCallUrl], [elementCallUrl], [executeCallUrl, executeCallOptions]] = calls as any
        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(elementCallUrl.pathname).toEqual('/session/foobar-123/element')
        expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
        expect(JSON.parse(executeCallOptions.body)).toMatchSnapshot()
    })

    it('should execute a zoom for Android with the correct values', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
        // @ts-expect-error
        elem = await browser.$('#foo')
        // @ts-expect-error mock feature
        elem.elementId = { pinch: 'mockFunction'  }
        vi.mocked(validatePinchAndZoomOptions).mockReturnValue({
            duration: 1500,
            scale: 0.8
        })
        vi.mocked(calculateAndroidPinchAndZoomSpeed).mockReturnValue(888)

        await elem.zoom()

        const { calls } = vi.mocked(fetch).mock
        expect(calls).toHaveLength(3)
        const [[sessionCallUrl], [elementCallUrl], [executeCallUrl, executeCallOptions]] = calls as any
        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(elementCallUrl.pathname).toEqual('/session/foobar-123/element')
        expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
        expect(JSON.parse(executeCallOptions.body)).toMatchSnapshot()
    })
})
