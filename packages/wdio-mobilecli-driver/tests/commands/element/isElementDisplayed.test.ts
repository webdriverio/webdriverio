import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { isElementDisplayed } from '../../../src/commands/element/isElementDisplayed.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { createSession, findElementId, getMethods, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('isElementDisplayed', () => {
    it('says that an element with a size is displayed, with one look at the screen', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')
        fetchMock.mockClear()

        expect(await isElementDisplayed(session, general)).toBe(true)
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('says that an element without a size is not displayed', async () => {
        const session = createSession()
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        const tree = structuredClone(IOS_TREE)
        tree[1].children![0].rect = { x: 0, y: 0, width: 0, height: 0 }
        screen.tree = tree

        expect(await isElementDisplayed(session, general)).toBe(false)
    })

    it('takes what mobilecli says about the element over its size', async () => {
        const session = createSession()
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        const tree = structuredClone(IOS_TREE)
        tree[1].children![0].visible = false
        screen.tree = tree

        expect(await isElementDisplayed(session, general)).toBe(false)
    })

    it('says that an element that is gone is not displayed, and does not wait for it', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')
        fetchMock.mockClear()

        screen.tree = undefined

        expect(await isElementDisplayed(session, general)).toBe(false)
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('throws a no such element error for an id of another session', async () => {
        mockScreen(IOS_TREE)

        await expect(isElementDisplayed(createSession(), 'nope')).rejects.toThrow(expect.objectContaining({ name: 'no such element' }))
    })
})
