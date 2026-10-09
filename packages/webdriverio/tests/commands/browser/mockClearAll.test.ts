import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { mockClearAll } from '../../../src/commands/browser/mockClearAll.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/browsingContext.js', () => ({
    contextIdOf: vi.fn(async (scope: { context: string }) => scope.context)
}))
vi.mock('../../../src/commands/browser/mock.js', () => ({
    SESSION_MOCKS: {},
    default: vi.fn()
}))

describe('mockClearAll', () => {
    beforeEach(() => {
        for (const key of Object.keys(SESSION_MOCKS)) {
            delete SESSION_MOCKS[key]
        }
    })

    it('clears only the calling session and preserves other multiremote mocks', async () => {
        const clearA = vi.fn()
        const clearB = vi.fn()
        const clearOther = vi.fn()
        SESSION_MOCKS.sessionA = new Set([{ clear: clearA }, { clear: clearB }] as any)
        SESSION_MOCKS.sessionB = new Set([{ clear: clearOther }] as any)

        await mockClearAll.call({ context: 'sessionA' } as unknown as WebdriverIO.Browser)

        expect(clearA).toHaveBeenCalledTimes(1)
        expect(clearB).toHaveBeenCalledTimes(1)
        expect(clearOther).not.toHaveBeenCalled()
    })

    it('does not touch other sessions when its context has no mocks', async () => {
        const clearOther = vi.fn()
        SESSION_MOCKS.sessionB = new Set([{ clear: clearOther }] as any)
        await mockClearAll.call({ context: 'sessionA' } as unknown as WebdriverIO.Browser)
        expect(clearOther).not.toHaveBeenCalled()
    })
})
