import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { deleteSession } from '../../../src/commands/browser/deleteSession.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { createSession, findElementId, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('deleteSession', () => {
    it('ends the session without a call to mobilecli', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)

        expect(await deleteSession(session)).toBe(null)

        expect(session.ended).toBe(true)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('forgets the elements of the session', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)
        const element = await findElementId(session, 'accessibility id', 'Settings')

        await deleteSession(session)

        expect(() => session.elements.resolve(element, IOS_TREE, 'ios'))
            .toThrow(expect.objectContaining({ name: 'no such element' }))
    })
})
