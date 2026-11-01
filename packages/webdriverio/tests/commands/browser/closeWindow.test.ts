import path from 'node:path'
import { expect, describe, it, beforeAll, beforeEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const contextMocks = vi.hoisted(() => ({
    switchToRemainingWindow: vi.fn(async (_windowHandles?: string[]) => {})
}))

vi.mock('../../../src/session/context.js', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    getContextManager: vi.fn(() => ({
        initialize: vi.fn().mockResolvedValue('window-1'),
        switchToRemainingWindow: contextMocks.switchToRemainingWindow
    }))
}))

describe('closeWindow', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    beforeEach(() => {
        contextMocks.switchToRemainingWindow.mockReset()
        vi.mocked(fetch).mockClear()
    })

    it('deletes the classic window endpoint and resolves after the switch to the remaining window', async () => {
        let release!: () => void
        contextMocks.switchToRemainingWindow.mockImplementation(() => new Promise<void>((resolve) => { release = resolve }))
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([['window-2', 'window-3']])

        let resolved = false
        const closed = browser.closeWindow().then(() => { resolved = true })

        await vi.waitFor(() => expect(contextMocks.switchToRemainingWindow).toHaveBeenCalledWith(['window-2', 'window-3']))
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/window' }),
            expect.objectContaining({ method: 'DELETE' })
        )
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(resolved).toBe(false)

        release()
        await closed
        expect(resolved).toBe(true)
    })

    it('returns the remaining window handles', async () => {
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([['window-2']])

        expect(await (browser.closeWindow() as Promise<unknown>)).toEqual(['window-2'])
    })

    it('does not switch when the driver rejects closeWindow', async () => {
        // @ts-expect-error mock feature
        vi.mocked(fetch).setMockResponse([{ statusCode: 404, error: 'no such window', message: 'target window already closed' }])

        await expect(browser.closeWindow()).rejects.toThrow('target window already closed')
        expect(contextMocks.switchToRemainingWindow).not.toHaveBeenCalled()
    })
})
