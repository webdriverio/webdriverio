import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { SPRINGBOARD_BUNDLE_ID } from '../../../src/utils/mobileDialog.js'

vi.mock('fetch')

const iosNativeCaps = {
    browserName: 'foobar',
    mobileMode: true,
    nativeAppMode: true,
    platformName: 'iOS',
} as const

const androidNativeCaps = {
    browserName: 'foobar',
    mobileMode: true,
    nativeAppMode: true,
    platformName: 'Android',
} as const

describe('acceptDialog command', () => {
    it('should throw an error for non-mobile platforms', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })

        await expect(browser.acceptDialog()).rejects.toThrow(
            'The `acceptDialog` command is only available for mobile platforms.'
        )
    })

    it('should throw an error when not in the native context', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        await expect(browser.acceptDialog()).rejects.toThrow(
            'The `acceptDialog` command is only available for mobile platforms in the NATIVE context.'
        )
    })

    it('should throw an error for Windows native sessions', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                windowsAppMode: true,
            } as any
        })

        await expect(browser.acceptDialog()).rejects.toThrow(
            'The `acceptDialog` command is only available for iOS and Android.'
        )
    })
})

describe('acceptDialog - iOS', () => {
    let browser: WebdriverIO.Browser
    let clickSpy: ReturnType<typeof vi.fn>
    let executeSpy: ReturnType<typeof vi.spyOn>
    let acceptAlertSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        clickSpy = vi.fn().mockResolvedValue(undefined)

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: iosNativeCaps as any
        })

        vi.spyOn(browser, '$').mockImplementation(() => ({
            click: clickSpy
        }) as any)

        executeSpy = vi.spyOn(browser, 'execute').mockImplementation(async (command: string) => {
            if (command === 'mobile: activeAppInfo') {
                return { bundleId: 'com.example.app' }
            }
            return undefined
        })
        acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)
    })

    it('should accept the default dialog via acceptAlert on iOS', async () => {
        await browser.acceptDialog()

        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', { bundleId: SPRINGBOARD_BUNDLE_ID })
        expect(acceptAlertSpy).toHaveBeenCalledOnce()
        expect(browser.$).not.toHaveBeenCalled()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should accept a dialog by button label on iOS', async () => {
        await browser.acceptDialog('Allow')

        expect(browser.$).toHaveBeenCalledWith('~Allow')
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(acceptAlertSpy).not.toHaveBeenCalled()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should handle no dialog found on iOS silently', async () => {
        clickSpy.mockRejectedValue(new Error('no such element'))

        await expect(browser.acceptDialog('Allow')).resolves.toBeUndefined()
        expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should re-throw non-"no such element" errors on iOS', async () => {
        clickSpy.mockRejectedValue(new Error('session expired'))

        await expect(browser.acceptDialog('Allow')).rejects.toThrow('session expired')
        expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should reactivate the original app if SpringBoard activation fails', async () => {
        executeSpy.mockImplementation(async (command: string, args?: { bundleId?: string }) => {
            if (command === 'mobile: activeAppInfo') {
                return { bundleId: 'com.example.app' }
            }
            if (command === 'mobile: activateApp' && args?.bundleId === SPRINGBOARD_BUNDLE_ID) {
                throw new Error('failed to activate SpringBoard')
            }
            return undefined
        })

        await expect(browser.acceptDialog()).rejects.toThrow('failed to activate SpringBoard')
        expect(executeSpy).toHaveBeenCalledWith('mobile: activateApp', { bundleId: 'com.example.app' })
    })
})

describe('acceptDialog - Android', () => {
    let browser: WebdriverIO.Browser
    let clickSpy: ReturnType<typeof vi.fn>
    let acceptAlertSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        clickSpy = vi.fn().mockResolvedValue(undefined)

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: androidNativeCaps as any
        })

        vi.spyOn(browser, '$').mockImplementation(() => ({
            click: clickSpy
        }) as any)
        acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)
    })

    it('should accept the default dialog via acceptAlert on Android', async () => {
        await browser.acceptDialog()

        expect(acceptAlertSpy).toHaveBeenCalledOnce()
        expect(browser.$).not.toHaveBeenCalled()
    })

    it('should accept a dialog by button text on Android', async () => {
        await browser.acceptDialog('Allow')

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='Allow']")
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(acceptAlertSpy).not.toHaveBeenCalled()
    })

    it('should use a valid XPath for button labels containing apostrophes', async () => {
        await browser.acceptDialog("Don't Allow")

        expect(browser.$).toHaveBeenCalledWith('//android.widget.Button[@text="Don\'t Allow"]')
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should handle no dialog found on Android silently', async () => {
        clickSpy.mockRejectedValue(new Error('no such element'))

        await expect(browser.acceptDialog('Allow')).resolves.toBeUndefined()
    })

    it('should treat Appium missing-element responses as a no-op', async () => {
        clickSpy.mockRejectedValue(new Error(
            'An element could not be located on the page using the given search parameters.'
        ))

        await expect(browser.acceptDialog('Allow')).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such element" errors on Android', async () => {
        clickSpy.mockRejectedValue(new Error('device disconnected'))

        await expect(browser.acceptDialog('Allow')).rejects.toThrow('device disconnected')
    })
})
