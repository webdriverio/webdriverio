import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { AsyncLocalStorage } from 'node:async_hooks'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore, getContextManager } from '../../../src/session/context.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'
import WebDriverInterception from '../../../src/utils/interception/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('mock', () => {
    let browser: WebdriverIO.Browser

    it('should throw if Bidi is not used', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'chrome'
            }
        })

        await expect(() => browser.mock('')).rejects.toThrow(/only supported/)
    })

    it('can initiate a mock', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const mock = browser.mock('**/*').catch(() => { /* ignore */ })
        expect(SESSION_MOCKS[`session:${browser.sessionId}`]).toContain(mock)
    })

    it('should restore existing mock with same definition', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const firstMock = {
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true),
            isScopedTo: vi.fn().mockReturnValue(true)
        }
        const secondMock = {
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true),
            isScopedTo: vi.fn().mockReturnValue(true)
        }
        const initiateSpy = vi.spyOn(WebDriverInterception, 'initiate')
            .mockResolvedValueOnce(firstMock as any)
            .mockResolvedValueOnce(secondMock as any)

        const createdFirstMock = await browser.mock('**/foo', { method: 'GET' })
        const createdSecondMock = await browser.mock('**/foo', { method: 'GET' })

        expect(initiateSpy).toHaveBeenCalledTimes(2)
        expect(firstMock.restore).toHaveBeenCalledTimes(1)
        expect(createdFirstMock).not.toBe(createdSecondMock)
        const allContexts = Object.values(SESSION_MOCKS)
        const totalMocks = allContexts.reduce((acc, mocks) => acc + mocks.size, 0)
        expect(totalMocks).toBe(1)
        expect(allContexts.some((mocks) => mocks.has(createdSecondMock as any))).toBe(true)
        initiateSpy.mockRestore()
    })

    it('scopes the intercept to the store context in a parallel test', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })
        const noopStore = getParallelContextStore()
        const store = new AsyncLocalStorage<string>()
        setParallelContextStore(store)
        const initiateSpy = vi.spyOn(WebDriverInterception, 'initiate').mockResolvedValue({ restore: vi.fn(), isSameDefinition: vi.fn().mockReturnValue(false) } as any)
        try {
            await store.run('ctx-1', () => browser.mock('**/scoped'))
            expect(initiateSpy).toHaveBeenLastCalledWith('**/scoped', {}, browser, { contexts: ['ctx-1'], sessionKey: 'ctx-1', test: 'ctx-1' })

            await browser.mock('**/global')
            expect(initiateSpy).toHaveBeenLastCalledWith('**/global', {}, browser, expect.objectContaining({ contexts: undefined, sessionKey: `session:${browser.sessionId}` }))
        } finally {
            setParallelContextStore(noopStore)
            initiateSpy.mockRestore()
        }
    })

    describe('registry key', () => {
        const fake = (scopedTo: boolean) => ({
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true),
            isScopedTo: vi.fn().mockReturnValue(scopedTo)
        })

        it('keeps a session-wide mock and a tab mock of the same url', async () => {
            browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'bidi' } })
            const sessionWide = fake(false)
            const tabMock = fake(false)
            const noopStore = getParallelContextStore()
            const initiateSpy = vi.spyOn(WebDriverInterception, 'initiate')
                .mockResolvedValueOnce(sessionWide as any)
                .mockResolvedValueOnce(tabMock as any)
            try {
                await browser.mock('**/foo')
                const store = new AsyncLocalStorage<string>()
                setParallelContextStore(store)
                const current = await getContextManager(browser).getCurrentContext()
                await store.run(current, () => browser.mock('**/foo'))
                expect(sessionWide.restore).not.toHaveBeenCalled()
            } finally {
                setParallelContextStore(noopStore)
                initiateSpy.mockRestore()
                for (const key of Object.keys(SESSION_MOCKS)) { delete SESSION_MOCKS[key] }
            }
        })

        it('replaces a session-wide mock of the same url also after the current tab changed', async () => {
            browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'bidi' } })
            const first = fake(true)
            const second = fake(true)
            const initiateSpy = vi.spyOn(WebDriverInterception, 'initiate')
                .mockResolvedValueOnce(first as any)
                .mockResolvedValueOnce(second as any)
            try {
                await browser.mock('**/foo')
                vi.spyOn(browser, 'getWindowHandle').mockResolvedValue('another-tab' as any)
                await browser.mock('**/foo')
                expect(first.restore).toHaveBeenCalledTimes(1)
                expect(initiateSpy).toHaveBeenLastCalledWith('**/foo', {}, browser, expect.objectContaining({ sessionKey: `session:${browser.sessionId}` }))
            } finally {
                initiateSpy.mockRestore()
                for (const key of Object.keys(SESSION_MOCKS)) { delete SESSION_MOCKS[key] }
            }
        })
    })
})
