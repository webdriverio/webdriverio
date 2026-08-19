import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DialogManager, Dialog } from '../../src/session/dialog.js'
import { remote } from '../../src/index.js'
import * as contextModule from '../../src/session/context.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockReturnValue({
        getCurrentContext: vi.fn().mockResolvedValue('ctx-1'),
        initialize: vi.fn().mockResolvedValue(true)
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
                getCurrentContext: vi.fn().mockResolvedValue('different-context'),
                initialize: vi.fn().mockResolvedValue(true)
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
