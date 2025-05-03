import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { remote } from '../../../src/index.js'
import { Dialog } from '../../../src/session/dialog.js'
import type { BrowsingContextUserPromptOpenedParameters } from '../../../../webdriver/build/bidi/localTypes.js'

vi.mock('../../../src/session/context.js', () => ({
    getContextManager: vi.fn(),
}))
import { getContextManager } from '../../../src/session/context.js'

describe('accept', () => {
    let browser: WebdriverIO.Browser
    let dialog: Dialog
    let mockContextManager: { getCurrentContext: () => Promise<string> }
    let browseStub

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'dialog' }
        })

        browseStub = vi.spyOn(browser, 'browsingContextHandleUserPrompt')
            .mockResolvedValue({})

        mockContextManager = {
            getCurrentContext: vi.fn()
        };

        (getContextManager as Mock).mockReturnValue(mockContextManager)
    })

    it('should NOT call browsingContextHandleUserPrompt if contexts differ', async () => {
        const fakeEvent = {
            context: 'ctx-A',
            message: 'ignored',
            defaultValue: '',
            type: 'alert',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)

        // simulate a *different* active context
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-B')
        await dialog.accept('foo')

        expect(browseStub).not.toHaveBeenCalled()
    })

    it('should call browsingContextHandleUserPrompt if contexts match', async () => {
        const fakeEvent = {
            context: 'ctx-A',
            message: 'ignored',
            defaultValue: '',
            type: 'prompt',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)

        // simulate *same* active context
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-A')
        await dialog.accept('my input')

        expect(browseStub).toHaveBeenCalledWith({
            accept: true,
            context: 'ctx-A',
            userText: 'my input'
        })
    })

    it('should call getCurrentContext once and pass undefined userText when none provided', async () => {
        const fakeEvent = {
            context: 'ctx-A',
            message: 'msg',
            defaultValue: '',
            type: 'prompt',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-A')

        await dialog.accept()

        expect(mockContextManager.getCurrentContext).toHaveBeenCalledTimes(1)

        expect(browseStub).toHaveBeenCalledWith({
            accept: true,
            context: 'ctx-A',
            userText: undefined
        })
    })

    it('should handle any dialog type the same way when contexts match', async () => {
        for (const type of ['alert', 'confirm', 'prompt', 'beforeunload'] as const) {
            const fakeEvent = {
                context: 'ctx-X',
                message: 'm',
                defaultValue: '',
                type: type,
            } as BrowsingContextUserPromptOpenedParameters

            dialog = new Dialog(fakeEvent, browser)
            mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-X')
            browseStub.mockClear()

            await dialog.accept('foo')
            expect(browseStub).toHaveBeenCalledWith({
                accept: true,
                context: 'ctx-X',
                userText: 'foo'
            })
        }
    })
})
