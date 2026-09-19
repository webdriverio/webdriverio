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

describe('dismissDialog command', () => {
    it('should throw an error for non-mobile platforms', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })

        await expect(browser.dismissDialog()).rejects.toThrow(
            'The `dismissDialog` command is only available for mobile platforms.'
        )
    })

    it('should throw an error when not in the native context', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        await expect(browser.dismissDialog()).rejects.toThrow(
            'The `dismissDialog` command is only available for mobile platforms in the NATIVE context.'
        )
    })

    it('should throw an error for macOS native sessions', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                macAppMode: true,
            } as any
        })

        await expect(browser.dismissDialog()).rejects.toThrow(
            'The `dismissDialog` command is only available for iOS and Android.'
        )
    })
})

describe('dismissDialog - iOS', () => {
    let browser: WebdriverIO.Browser
    let clickSpy: ReturnType<typeof vi.fn>
    let executeSpy: ReturnType<typeof vi.spyOn>
    let dismissAlertSpy: ReturnType<typeof vi.spyOn>

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
        dismissAlertSpy = vi.spyOn(browser, 'dismissAlert').mockResolvedValue(undefined)
    })

    it('should dismiss the default dialog via dismissAlert on iOS', async () => {
        await browser.dismissDialog()

        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', { bundleId: SPRINGBOARD_BUNDLE_ID })
        expect(dismissAlertSpy).toHaveBeenCalledOnce()
        expect(browser.$).not.toHaveBeenCalled()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should dismiss a dialog by button label on iOS', async () => {
        await browser.dismissDialog("Don't Allow")

        expect(browser.$).toHaveBeenCalledWith("~Don't Allow")
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(dismissAlertSpy).not.toHaveBeenCalled()
    })
})

describe('dismissDialog - Android', () => {
    let browser: WebdriverIO.Browser
    let clickSpy: ReturnType<typeof vi.fn>
    let dismissAlertSpy: ReturnType<typeof vi.spyOn>

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
        dismissAlertSpy = vi.spyOn(browser, 'dismissAlert').mockResolvedValue(undefined)
    })

    it('should dismiss the default dialog via dismissAlert on Android', async () => {
        await browser.dismissDialog()

        expect(dismissAlertSpy).toHaveBeenCalledOnce()
        expect(browser.$).not.toHaveBeenCalled()
    })

    it('should dismiss a dialog by button text on Android', async () => {
        await browser.dismissDialog('Cancel')

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='Cancel']")
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(dismissAlertSpy).not.toHaveBeenCalled()
    })

    it('should use a valid XPath for button labels containing apostrophes', async () => {
        await browser.dismissDialog("Don't Allow")

        expect(browser.$).toHaveBeenCalledWith('//android.widget.Button[@text="Don\'t Allow"]')
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should handle no dialog found on Android silently', async () => {
        clickSpy.mockRejectedValue(new Error('no such element'))

        await expect(browser.dismissDialog('Cancel')).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such element" errors on Android', async () => {
        clickSpy.mockRejectedValue(new Error('device disconnected'))

        await expect(browser.dismissDialog('Cancel')).rejects.toThrow('device disconnected')
    })
})
