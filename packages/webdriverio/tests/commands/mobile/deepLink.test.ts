import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('deepLink test', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
    })

    it('should open a deep link for iOS', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        const executeSpy = vi.spyOn(browser, 'execute')

        await expect(browser.deepLink('wdio://drag', 'com.wdio.app'))

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile:deepLink', {
            url: 'wdio://drag',
            bundleId: 'com.wdio.app'
        })
    })

    it('should open a deep link for Android', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        const executeSpy = vi.spyOn(browser, 'execute')

        await expect(browser.deepLink('wdio://drag', 'com.wdio.app'))

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile:deepLink', {
            url: 'wdio://drag',
            package: 'com.wdio.app'
        })
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        await expect(browser.deepLink('string', 'string')).rejects.toThrow('The `deepLink` command is only available for mobile platforms.')
    })

    it('should throw an error when the an invalid deep link is provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        // @ts-expect-error test invalid input
        await expect(browser.deepLink('string')).rejects.toThrow('The provided link is not a valid deep link URL. If your url is a `universal deep link` then use the `url` command instead.')
    })

    it('should throw an error when no bundleId is provided for iOS', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        // @ts-expect-error test invalid input
        await expect(browser.deepLink('wdio://drag')).rejects.toThrow('When using a deep link URL for iOS, you need to provide the `bundleId` of the app that the deep link should open.')
    })

    it('should throw an error when no package is provided for Android', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        // @ts-expect-error test invalid input
        await expect(browser.deepLink('wdio://drag')).rejects.toThrow('When using a deep link URL for Android, you need to provide the `package` of the app that the deep link should open.')
    })
})
