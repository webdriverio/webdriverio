import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { mockRestoreAll } from '../../../src/commands/browser/mockRestoreAll.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/browsingContext.js', () => ({
    contextIdOf: vi.fn(async (scope: { context: string }) => scope.context)
}))
vi.mock('../../../src/commands/browser/mock.js', () => ({
    SESSION_MOCKS: {},
    default: vi.fn()
}))

describe('mockRestoreAll', () => {
    beforeEach(() => {
        for (const key of Object.keys(SESSION_MOCKS)) {
            delete SESSION_MOCKS[key]
        }
    })

    it('restores only the calling session and preserves other multiremote mocks', async () => {
        const restoreA = vi.fn().mockResolvedValue(undefined)
        const restoreB = vi.fn().mockResolvedValue(undefined)
        const restoreOther = vi.fn().mockResolvedValue(undefined)
        SESSION_MOCKS.sessionA = new Set([{ restore: restoreA }, { restore: restoreB }] as any)
        SESSION_MOCKS.sessionB = new Set([{ restore: restoreOther }] as any)

        await mockRestoreAll.call({ context: 'sessionA' } as unknown as WebdriverIO.Browser)

        expect(restoreA).toHaveBeenCalledTimes(1)
        expect(restoreB).toHaveBeenCalledTimes(1)
        expect(restoreOther).not.toHaveBeenCalled()
    })

    it('does not touch other sessions when its context has no mocks', async () => {
        const restoreOther = vi.fn()
        SESSION_MOCKS.sessionB = new Set([{ restore: restoreOther }] as any)
        await mockRestoreAll.call({ context: 'sessionA' } as unknown as WebdriverIO.Browser)
        expect(restoreOther).not.toHaveBeenCalled()
    })
})
