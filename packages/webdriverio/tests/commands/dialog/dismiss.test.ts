import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { remote } from '../../../src/index.js'
import { Dialog } from '../../../src/session/dialog.js'
import type { BrowsingContextUserPromptOpenedParameters } from '../../../../webdriver/build/bidi/localTypes.js'

vi.mock('../../../src/session/context.js', () => ({
    getContextManager: vi.fn(),
}))
import { getContextManager } from '../../../src/session/context.js'

describe('dismiss', () => {
    let browser: WebdriverIO.Browser
    let dialog: Dialog
    let mockContextManager: { getCurrentContext: () => Promise<string> }
    let browseStub: ReturnType<typeof vi.spyOn>

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
            message: 'some message',
            defaultValue: '',
            type: 'confirm',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)

        // simulate a *different* active context
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-B')
        await dialog.dismiss()

        expect(browseStub).not.toHaveBeenCalled()
    })

    it('should call browsingContextHandleUserPrompt if contexts match', async () => {
        const fakeEvent = {
            context: 'ctx-A',
            message: 'some message',
            defaultValue: '',
            type: 'confirm',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)

        // simulate *same* active context
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-A')
        await dialog.dismiss()

        expect(browseStub).toHaveBeenCalledWith({
            accept: false,
            context: 'ctx-A'
        })
        expect(browseStub).toHaveBeenCalledTimes(1)
    })

    it('should call getCurrentContext once', async () => {
        const fakeEvent = {
            context: 'ctx-A',
            message: 'msg',
            defaultValue: '',
            type: 'prompt',
        } as BrowsingContextUserPromptOpenedParameters

        dialog = new Dialog(fakeEvent, browser)
        mockContextManager.getCurrentContext = vi.fn().mockResolvedValue('ctx-A')

        await dialog.dismiss()

        expect(mockContextManager.getCurrentContext).toHaveBeenCalledTimes(1)

        expect(browseStub).toHaveBeenCalledWith({
            accept: false,
            context: 'ctx-A',
        })
        expect(browseStub).toHaveBeenCalledTimes(1)
    })
})
