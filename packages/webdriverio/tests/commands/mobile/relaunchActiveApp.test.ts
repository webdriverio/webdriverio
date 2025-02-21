import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('relaunchActiveApp test', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
    })

    it('should restart the iOS app WITHOUT arguments and environment vars', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        const executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app', processArguments: { args: [], env: {} } })
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })

        await browser.relaunchActiveApp()

        expect(executeSpy).toHaveBeenCalledTimes(3)
        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: terminateApp', { bundleId: 'com.example.app' })
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile:launchApp', { bundleId: 'com.example.app' })
    })

    it('should restart the iOS app WITH arguments and environment vars', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        const executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app', processArguments: { args: ['string', 'string2'], env: { var: 'value' } } })
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })

        await browser.relaunchActiveApp()

        expect(executeSpy).toHaveBeenCalledTimes(3)
        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: terminateApp', { bundleId: 'com.example.app' })
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile:launchApp', { bundleId: 'com.example.app', arguments: ['string', 'string2'], environment: { var: 'value' }  })
    })

    it('should restart the Android app', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        const currentPackageSpy = vi.spyOn(browser, 'getCurrentPackage').mockResolvedValue('com.wdiodemoapp')
        const executeSpy = vi.spyOn(browser, 'execute')

        await browser.relaunchActiveApp()

        expect(currentPackageSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledTimes(2)
        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: terminateApp', {  appId: 'com.wdiodemoapp' })
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', {  appId: 'com.wdiodemoapp'  })
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })
        await expect(browser.relaunchActiveApp()).rejects.toThrow('The `relaunchActiveApp` command is only available for mobile platforms.')
    })

})
