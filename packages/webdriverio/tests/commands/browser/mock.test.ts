import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { AsyncLocalStorage } from 'node:async_hooks'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'
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
        expect(SESSION_MOCKS[browser.sessionId]).toContain(mock)
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
            isSameDefinition: vi.fn().mockReturnValue(true)
        }
        const secondMock = {
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true)
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
            expect(initiateSpy).toHaveBeenLastCalledWith('**/scoped', {}, browser, { contexts: ['ctx-1'], sessionKey: 'ctx-1' })

            await browser.mock('**/global')
            expect(initiateSpy).toHaveBeenLastCalledWith('**/global', {}, browser, expect.objectContaining({ contexts: undefined }))
        } finally {
            setParallelContextStore(noopStore)
            initiateSpy.mockRestore()
        }
    })
})
