import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { getElementText } from '../../../src/commands/element/getElementText.js'
import { isElementDisplayed } from '../../../src/commands/element/isElementDisplayed.js'
import { ANDROID_DEVICE } from '../../__fixtures__/server.js'
import { ANDROID_TREE, IOS_TREE } from '../../__fixtures__/trees.js'
import { NO_WAIT, createSession, findElementId, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('getElementText', () => {
    it('does not read an element that a newer look at the screen did not find', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'General', { justNow: true })

        screen.tree = [IOS_TREE[0]]
        expect(await isElementDisplayed(session, general)).toBe(false)

        await expect(getElementText(session, general)).rejects.toThrow('no matching element found')
    })

    it('reads the text of an element on iOS', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        expect(await getElementText(session, await findElementId(session, 'accessibility id', 'General'))).toBe('General')
    })

    it('reads the text of an element on Android', async () => {
        const session = createSession(ANDROID_DEVICE)
        mockScreen(ANDROID_TREE)

        expect(await getElementText(session, await findElementId(session, 'id', 'title'))).toBe('Login')
        // no text: the label, as in Mobilewright
        expect(await getElementText(session, await findElementId(session, 'id', 'username'))).toBe('username')
    })

    it('reads the text that is on the screen now', async () => {
        const session = createSession()
        const { screen } = mockScreen(IOS_TREE)
        const text = await findElementId(session, 'class name', 'XCUIElementTypeStaticText')

        const changed = structuredClone(IOS_TREE)
        changed[0].children![0].label = 'Instellingen'
        screen.tree = changed

        expect(await getElementText(session, text)).toBe('Instellingen')
    })

    it('waits until the element is visible', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const text = await findElementId(session, 'accessibility id', 'General')
        vi.useFakeTimers()

        screen.tree = undefined
        const reading = getElementText(session, text)
        await vi.advanceTimersByTimeAsync(250)
        screen.tree = IOS_TREE
        await vi.advanceTimersByTimeAsync(100)

        expect(await reading).toBe('General')
        expect(fetchMock.mock.calls.length).toBeGreaterThan(3)
    })

    it('uses what the find saw if it was right before', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const text = await findElementId(session, 'accessibility id', 'General', { justNow: true })
        fetchMock.mockClear()

        expect(await getElementText(session, text)).toBe('General')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen } = mockScreen(IOS_TREE)
        const text = await findElementId(session, 'accessibility id', 'General')

        screen.tree = undefined

        await expect(getElementText(session, text)).rejects.toThrow(expect.objectContaining({ name: 'MobilecliTimeoutError' }))
    })
})
