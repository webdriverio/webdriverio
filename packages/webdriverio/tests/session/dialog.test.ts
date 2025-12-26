import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DialogManager } from '../../src/session/dialog.js'

describe('DialogManager', () => {
    let browser: any
    let dialogManager: DialogManager

    beforeEach(() => {
        browser = {
            isBidi: true,
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
})
