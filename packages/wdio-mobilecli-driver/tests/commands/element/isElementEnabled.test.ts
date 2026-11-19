import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { isElementEnabled } from '../../../src/commands/element/isElementEnabled.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { createSession, findElementId, getMethods, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('isElementEnabled', () => {
    it('says that an element is enabled if mobilecli does not say that it is not', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')
        fetchMock.mockClear()

        expect(await isElementEnabled(session, general)).toBe(true)
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])

        const tree = structuredClone(IOS_TREE)
        tree[1].children![0].enabled = false
        screen.tree = tree
        expect(await isElementEnabled(session, general)).toBe(false)
    })

    it('says that an element that is gone is not enabled, and does not wait for it', async () => {
        const session = createSession()
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        screen.tree = undefined

        expect(await isElementEnabled(session, general)).toBe(false)
    })
})
