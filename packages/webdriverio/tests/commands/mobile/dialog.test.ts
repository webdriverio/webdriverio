import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('dialog command', () => {
    let browser: any
    let clickSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.mocked(fetch).mockClear()
        clickSpy = vi.fn().mockResolvedValue(undefined)
    })

    it('should throw an error for non-mobile platforms', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            } as any
        })

        await expect(browser.dialog()).rejects.toThrow('The `dialog` command is only available for mobile platforms.')
    })

    it('should return a MobileDialog instance for iOS', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        const dialog = browser.dialog()
        expect(dialog).toBeDefined()
        expect(dialog.message()).toBe('')
        expect(dialog.type()).toBe('alert')
        expect(dialog.defaultValue()).toBe('')
    })

    it('should return a MobileDialog instance for Android', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        const dialog = browser.dialog()
        expect(dialog).toBeDefined()
        expect(dialog.message()).toBe('')
        expect(dialog.type()).toBe('alert')
        expect(dialog.defaultValue()).toBe('')
    })
})

describe('MobileDialog - iOS', () => {
    let browser: any
    let clickSpy: ReturnType<typeof vi.fn>
    let executeSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        clickSpy = vi.fn().mockResolvedValue(undefined)

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })

        // Use spyOn instead of direct assignment
        vi.spyOn(browser, '$').mockImplementation(() => ({
            click: clickSpy
        }))

        executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' }) // activeAppInfo
            .mockResolvedValueOnce(undefined) // activateApp (SpringBoard)
            .mockResolvedValueOnce(undefined) // activateApp (original app)
    })

    it('should accept dialog by clicking OK button on iOS', async () => {
        const dialog = browser.dialog()

        await dialog.accept()

        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', { bundleId: 'com.apple.springboard' })
        expect(browser.$).toHaveBeenCalledWith('~OK')
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should accept dialog with custom button text on iOS', async () => {
        const dialog = browser.dialog()

        await dialog.accept('Allow')

        expect(browser.$).toHaveBeenCalledWith('~Allow')
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should dismiss dialog by clicking Cancel button on iOS', async () => {
        const dialog = browser.dialog()

        await dialog.dismiss()

        expect(browser.$).toHaveBeenCalledWith('~Cancel')
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should dismiss dialog with custom button text on iOS', async () => {
        const dialog = browser.dialog()

        await dialog.dismiss("Don't Allow")

        expect(browser.$).toHaveBeenCalledWith("~Don't Allow")
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should handle no dialog found on iOS silently', async () => {
        clickSpy.mockRejectedValue(new Error('no such element'))

        const dialog = browser.dialog()

        // Should not throw for "no such element"
        await expect(dialog.accept()).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such element" errors on iOS', async () => {
        clickSpy.mockRejectedValue(new Error('session expired'))

        const dialog = browser.dialog()

        await expect(dialog.accept()).rejects.toThrow('session expired')
    })
})

describe('MobileDialog - Android', () => {
    let browser: any
    let clickSpy: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        clickSpy = vi.fn().mockResolvedValue(undefined)

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        // Use spyOn instead of direct assignment
        vi.spyOn(browser, '$').mockImplementation(() => ({
            click: clickSpy
        }))
    })

    it('should accept dialog by clicking OK button on Android', async () => {
        const dialog = browser.dialog()

        await dialog.accept()

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='OK']")
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should accept dialog with custom button text on Android', async () => {
        const dialog = browser.dialog()

        await dialog.accept('Allow')

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='Allow']")
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should dismiss dialog by clicking Cancel button on Android', async () => {
        const dialog = browser.dialog()

        await dialog.dismiss()

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='Cancel']")
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should escape single quotes in button text on Android', async () => {
        const dialog = browser.dialog()

        await dialog.accept("Don't Allow")

        expect(browser.$).toHaveBeenCalledWith("//android.widget.Button[@text='Don\\'t Allow']")
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it('should handle no dialog found on Android silently', async () => {
        clickSpy.mockRejectedValue(new Error('no such element'))

        const dialog = browser.dialog()

        // Should not throw for "no such element"
        await expect(dialog.dismiss()).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such element" errors on Android', async () => {
        clickSpy.mockRejectedValue(new Error('device disconnected'))

        const dialog = browser.dialog()

        await expect(dialog.accept()).rejects.toThrow('device disconnected')
    })
})
