import { describe, expect, it, vi } from 'vitest'

import {
    allocateContext, cleanupAllocation, resolveMaxContexts, type ParallelContextBrowser
} from '../../src/parallel/contexts.js'

function makeBrowser(overrides: Partial<ParallelContextBrowser> = {}) {
    return {
        __parallelContexts: new Set<string>(),
        browsingContextCreate: vi.fn().mockResolvedValue({ context: 'ctx-1' }),
        browsingContextClose: vi.fn().mockResolvedValue(undefined),
        browserCreateUserContext: vi.fn().mockResolvedValue({ userContext: 'uc-1' }),
        browserRemoveUserContext: vi.fn().mockResolvedValue(undefined),
        ...overrides
    } satisfies ParallelContextBrowser
}

describe('allocateContext', () => {
    it('creates a window and registers it in contexts mode', async () => {
        const browser = makeBrowser()
        expect(await allocateContext(browser, 'contexts')).toEqual({ context: 'ctx-1' })
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window' })
        expect(browser.browserCreateUserContext).not.toHaveBeenCalled()
        expect(browser.__parallelContexts.has('ctx-1')).toBe(true)
    })

    it('creates a user context and passes it in userContexts mode', async () => {
        const browser = makeBrowser()
        expect(await allocateContext(browser, 'userContexts')).toEqual({ context: 'ctx-1', userContext: 'uc-1' })
        expect(browser.browsingContextCreate).toHaveBeenCalledWith({ type: 'window', userContext: 'uc-1' })
        expect(browser.__parallelContexts.has('ctx-1')).toBe(true)
    })

    it('removes the user context and rethrows when window creation fails', async () => {
        const browser = makeBrowser({ browsingContextCreate: vi.fn().mockRejectedValue(new Error('boom')) })
        await expect(allocateContext(browser, 'userContexts')).rejects.toThrow('boom')
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-1' })
        expect(browser.__parallelContexts.size).toBe(0)
    })

    it('still rethrows the original error when rollback fails', async () => {
        const browser = makeBrowser({
            browsingContextCreate: vi.fn().mockRejectedValue(new Error('boom')),
            browserRemoveUserContext: vi.fn().mockRejectedValue(new Error('rm failed'))
        })
        await expect(allocateContext(browser, 'userContexts')).rejects.toThrow('boom')
    })
})

describe('cleanupAllocation', () => {
    it('closes, removes the user context and unregisters', async () => {
        const browser = makeBrowser()
        browser.__parallelContexts.add('ctx-1')
        await cleanupAllocation(browser, { context: 'ctx-1', userContext: 'uc-1' })
        expect(browser.browsingContextClose).toHaveBeenCalledWith({ context: 'ctx-1' })
        expect(browser.browserRemoveUserContext).toHaveBeenCalledWith({ userContext: 'uc-1' })
        expect(browser.__parallelContexts.has('ctx-1')).toBe(false)
    })

    it('never rejects and still unregisters when close and remove fail', async () => {
        const browser = makeBrowser({
            browsingContextClose: vi.fn().mockRejectedValue(new Error('close failed')),
            browserRemoveUserContext: vi.fn().mockRejectedValue(new Error('rm failed'))
        })
        browser.__parallelContexts.add('ctx-1')
        await expect(cleanupAllocation(browser, { context: 'ctx-1', userContext: 'uc-1' })).resolves.toBeUndefined()
        expect(browser.__parallelContexts.has('ctx-1')).toBe(false)
    })

    it('skips user context removal without a userContext', async () => {
        const browser = makeBrowser()
        await cleanupAllocation(browser, { context: 'ctx-1' })
        expect(browser.browserRemoveUserContext).not.toHaveBeenCalled()
    })
})

describe('resolveMaxContexts', () => {
    it.each([
        [4, 1, 4],
        [2.9, 1, 2],
        [0.5, 3, 1],
        [0, 3, 3],
        [-2, 3, 3],
        [NaN, 3, 3],
        [Infinity, 3, 3],
        [undefined, 3, 3],
        ['5', 3, 3],
        [0, 0, 1]
    ])('resolveMaxContexts(%s, %s) === %s', (value, fallback, expected) => {
        expect(resolveMaxContexts(value, fallback)).toBe(expected)
    })
})
