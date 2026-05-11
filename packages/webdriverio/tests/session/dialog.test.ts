import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DialogManager, Dialog } from '../../src/session/dialog.js'
import { remote } from '../../src/index.js'
import * as contextModule from '../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockReturnValue({
        getCurrentContext: vi.fn().mockResolvedValue('ctx-1')
    })
}))

describe('DialogManager', () => {
    let browser: any
    let dialogManager: DialogManager

    beforeEach(() => {
        browser = {
            isBidi: true,
            isMobile: false,
            sessionId: 'session-id',
            sessionSubscribe: vi.fn().mockResolvedValue({}),
            on: vi.fn(),
            off: vi.fn(),
            removeAllListeners: vi.fn(),
            emit: vi.fn(),
            browsingContextHandleUserPrompt: vi.fn()
        }
        // Mock isEnabled to bypass environment check which disables it in unit tests
        vi.spyOn(DialogManager.prototype, 'isEnabled').mockReturnValue(true)
        dialogManager = new DialogManager(browser)
    })

    it('should ignore "no such alert" error when auto-handling dialogs', async () => {
        const log = { context: 'some-context' } as any

        // Mock handleUserPrompt to reject with "no such alert"
        browser.browsingContextHandleUserPrompt.mockRejectedValue(new Error('no such alert'))

        // We need to access the private #handleUserPrompt method or trigger it via the event listener
        // Since it's bound in constructor: this.#browser.on('browsingContext.userPromptOpened', this.#handleUserPrompt.bind(this))
        // We can simulate the event if we can get the listener.
        // However, accessing private private method via trigger might be hard if not exposed.
        // But since we are in test, we can try to call the listener registered to 'browsingContext.userPromptOpened'

        // Better approach for unit testing private method logic if strictly private:
        // Trigger the event handler registered in constructor
        const calls = browser.on.mock.calls
        const userPromptHandler = calls.find((call: unknown[]) => call[0] === 'browsingContext.userPromptOpened')?.[1]

        expect(userPromptHandler).toBeDefined()

        // Expectation: The promise should resolve without throwing (error caught internally)
        await expect(userPromptHandler(log)).resolves.toBeUndefined()

        // Verify handleUserPrompt was called
        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            accept: false,
            context: 'some-context'
        })
    })

    it('should re-throw other errors', async () => {
        const log = { context: 'some-context' } as any
        const msg = 'some other error'
        browser.browsingContextHandleUserPrompt.mockRejectedValue(new Error(msg))

        const calls = browser.on.mock.calls
        const userPromptHandler = calls.find((call: unknown[]) => call[0] === 'browsingContext.userPromptOpened')?.[1]

        expect(userPromptHandler).toBeDefined()

        await expect(userPromptHandler(log)).rejects.toThrow(msg)
    })

    it('should ignore "no such frame" error when context is gone', async () => {
        const log = { context: 'some-context' } as any
        browser.browsingContextHandleUserPrompt.mockRejectedValue(
            new Error('no such frame - Context some-context not found')
        )

        const calls = browser.on.mock.calls
        const userPromptHandler = calls.find((call: unknown[]) => call[0] === 'browsingContext.userPromptOpened')?.[1]

        expect(userPromptHandler).toBeDefined()
        await expect(userPromptHandler(log)).resolves.toBeUndefined()
        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            accept: false,
            context: 'some-context'
        })
    })
})

describe('Dialog - Browser', () => {
    let browser: any

    beforeEach(() => {
        browser = {
            isMobile: false,
            isBidi: true,
            browsingContextHandleUserPrompt: vi.fn().mockResolvedValue(undefined),
            sessionSubscribe: vi.fn().mockResolvedValue({}),
            on: vi.fn(),
            off: vi.fn(),
            removeAllListeners: vi.fn(),
            emit: vi.fn(),
        }
    })

    it('should accept a browser dialog', async () => {
        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Hello', type: 'alert' } as any,
            browser
        )

        await dialog.accept()

        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            accept: true,
            context: 'ctx-1',
        })
    })

    it('should accept a browser dialog with prompt text', async () => {
        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Hello', type: 'prompt', defaultValue: '' } as any,
            browser
        )

        await dialog.accept('my input')

        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            accept: true,
            context: 'ctx-1',
            userText: 'my input',
        })
    })

    it('should dismiss a browser dialog', async () => {
        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Hello', type: 'confirm' } as any,
            browser
        )

        await dialog.dismiss()

        expect(browser.browsingContextHandleUserPrompt).toHaveBeenCalledWith({
            accept: false,
            context: 'ctx-1',
        })
    })

    it('should return early if context does not match', async () => {
        // Use vi.doMock for dynamic mocking inside a test callback
        vi.doMock('../../src/session/context.js', () => ({
            getContextManager: vi.fn().mockReturnValue({
                getCurrentContext: vi.fn().mockResolvedValue('different-context')
            })
        }))

        // Fresh import to get the mocked module
        const { getContextManager } = await import('../../src/session/context.js')

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Hello', type: 'alert' } as any,
            browser
        )

        await dialog.accept()

        expect(browser.browsingContextHandleUserPrompt).not.toHaveBeenCalled()
        expect(getContextManager).toHaveBeenCalledWith(browser)

        // Reset the mock
        vi.doUnmock('../../src/session/context.js')
    })
})

describe('Dialog - iOS Mobile', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS',
            } as any
        })
    })

    it('should accept a mobile dialog on iOS', async () => {
        const executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' }) // activeAppInfo
            .mockResolvedValueOnce(undefined) // activateApp (SpringBoard)
            .mockResolvedValueOnce(undefined) // activateApp (original app)
        const acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        await dialog.accept()

        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', { bundleId: 'com.apple.springboard' })
        expect(acceptAlertSpy).toHaveBeenCalledOnce()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should accept a mobile dialog with text on iOS', async () => {
        const executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
        const sendAlertTextSpy = vi.spyOn(browser, 'sendAlertText').mockResolvedValue(undefined)
        const acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Enter value', type: 'prompt', defaultValue: '' } as any,
            browser
        )

        await dialog.accept('my input')

        expect(sendAlertTextSpy).toHaveBeenCalledWith('my input')
        expect(acceptAlertSpy).toHaveBeenCalledOnce()
    })

    it('should dismiss a mobile dialog on iOS', async () => {
        const executeSpy = vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
        const dismissAlertSpy = vi.spyOn(browser, 'dismissAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        await dialog.dismiss()

        expect(executeSpy).toHaveBeenNthCalledWith(1, 'mobile: activeAppInfo')
        expect(executeSpy).toHaveBeenNthCalledWith(2, 'mobile: activateApp', { bundleId: 'com.apple.springboard' })
        expect(dismissAlertSpy).toHaveBeenCalledOnce()
        expect(executeSpy).toHaveBeenNthCalledWith(3, 'mobile: activateApp', { bundleId: 'com.example.app' })
    })

    it('should handle no alert on iOS (silent catch)', async () => {
        vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
        vi.spyOn(browser, 'acceptAlert').mockRejectedValue(new Error('no such alert'))

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        // Should not throw for "no such alert"
        await expect(dialog.accept()).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such alert" errors on iOS', async () => {
        vi.spyOn(browser, 'execute')
            .mockResolvedValueOnce({ bundleId: 'com.example.app' })
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
        vi.spyOn(browser, 'acceptAlert').mockRejectedValue(new Error('device disconnected'))

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        // Should re-throw non-"no such alert" errors
        await expect(dialog.accept()).rejects.toThrow('device disconnected')
    })
})

describe('Dialog - Android Mobile', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'Android',
            } as any
        })
    })

    it('should accept a mobile dialog on Android', async () => {
        const acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        await dialog.accept()

        expect(acceptAlertSpy).toHaveBeenCalledOnce()
    })

    it('should accept a mobile dialog with text on Android', async () => {
        const sendAlertTextSpy = vi.spyOn(browser, 'sendAlertText').mockResolvedValue(undefined)
        const acceptAlertSpy = vi.spyOn(browser, 'acceptAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Enter value', type: 'prompt', defaultValue: '' } as any,
            browser
        )

        await dialog.accept('android input')

        expect(sendAlertTextSpy).toHaveBeenCalledWith('android input')
        expect(acceptAlertSpy).toHaveBeenCalledOnce()
    })

    it('should dismiss a mobile dialog on Android', async () => {
        const dismissAlertSpy = vi.spyOn(browser, 'dismissAlert').mockResolvedValue(undefined)

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        await dialog.dismiss()

        expect(dismissAlertSpy).toHaveBeenCalledOnce()
    })

    it('should handle no alert on Android (silent catch)', async () => {
        vi.spyOn(browser, 'dismissAlert').mockRejectedValue(new Error('no such alert'))

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        // Should not throw for "no such alert"
        await expect(dialog.dismiss()).resolves.toBeUndefined()
    })

    it('should re-throw non-"no such alert" errors on Android', async () => {
        vi.spyOn(browser, 'acceptAlert').mockRejectedValue(new Error('session expired'))

        const dialog = new Dialog(
            { context: 'ctx-1', message: 'Allow permission?', type: 'alert' } as any,
            browser
        )

        // Should re-throw non-"no such alert" errors
        await expect(dialog.accept()).rejects.toThrow('session expired')
    })
})
