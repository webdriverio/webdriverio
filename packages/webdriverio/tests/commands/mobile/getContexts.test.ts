import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { platform } from 'node:os'

vi.mock('fetch')

describe('getContexts test', () => {
    let browser: WebdriverIO.Browser

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
        await expect(browser.getContexts()).rejects.toThrow('The `switchContext` command is only available for mobile platforms.')
    })

    it('should call the default Appium endpoint if no options are provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts()
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
    })

    it('should call the default Appium endpoint if returnDetailedContexts is not provided', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts({})
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
    })

    it('should call the default Appium endpoint if returnDetailedContexts is set to false', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        await browser.getContexts({ returnDetailedContexts: false })
        const { calls } = vi.mocked(fetch).mock

        expect(calls).toHaveLength(2)

        const [[sessionCallUrl], [callUrl]] = calls as any

        expect(sessionCallUrl.pathname).toEqual('/session')
        expect(callUrl.pathname).toEqual('/session/foobar-123/contexts')
    })

    it('should return the detailed contexts for iOS if returnDetailedContexts is set to true', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
        const result = await browser.getContexts({ returnDetailedContexts: true })
        const iOSContexts = [
            { id: 'NATIVE_APP' },
            {
                id: 'WEBVIEW_86150.1',
                title: 'WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO',
                url: 'https://webdriver.io/',
                bundleId: 'org.reactjs.native.example.wdiodemoapp'
            },
            {
                id: 'WEBVIEW_86152.1',
                title: 'Apple',
                url: 'https://www.apple.com/',
                bundleId: 'com.apple.mobilesafari'
            }
        ]
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue(iOSContexts)
        const contexts = await browser.getContexts({ returnDetailedContexts: true })

        expect(executeSpy).toHaveBeenCalledTimes(1)
        expect(executeSpy).toHaveBeenCalledWith('mobile: getContexts')
        expect(contexts).toEqual(iOSContexts)
    })
})
