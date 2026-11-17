import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { waitForActionable, waitForVisible } from '../src/screen.js'
import { IOS_TREE } from './__fixtures__/trees.js'
import { NO_WAIT, createSession, findElementId, getMethods, mockScreen } from './__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

const GENERAL = 'com.apple.settings.general'

/**
 * the Settings screen with other fields for the General button
 */
const withGeneral = (fields: object) => {
    const tree = structuredClone(IOS_TREE)
    Object.assign(tree[1].children![0], fields)
    return tree
}

describe('waitForActionable', () => {
    it('looks twice, 50 ms apart, to know that the element does not move', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)
        fetchMock.mockClear()
        vi.useFakeTimers()

        const waiting = waitForActionable(session, general)
        await vi.advanceTimersByTimeAsync(49)
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
        await vi.advanceTimersByTimeAsync(1)

        expect((await waiting).ref).toBe('@e4')
        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui'])
    })

    it('looks once if the element was found right before: the find was the first look', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        fetchMock.mockClear()

        expect((await waitForActionable(session, general)).ref).toBe('@e4')
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('does not look if the element was found twice at the same place, as when WebdriverIO waited for it', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        // a look at the device takes its time, and the second find gets its own look
        await new Promise((resolve) => setTimeout(resolve, 5))
        session.lastDump = undefined
        const general = await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        fetchMock.mockClear()

        expect((await waitForActionable(session, general)).ref).toBe('@e4')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('looks once if the element was found twice in the same look', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        const general = await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        expect(fetchMock).toHaveBeenCalledTimes(1)
        fetchMock.mockClear()

        expect((await waitForActionable(session, general)).ref).toBe('@e4')
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('looks again if the find was more than 100 ms ago', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        vi.useFakeTimers()
        await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        const general = await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        fetchMock.mockClear()
        vi.advanceTimersByTime(101)

        expect((await waitForActionable(session, general)).ref).toBe('@e4')
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('waits until the element does not move anymore', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)
        fetchMock.mockClear()
        vi.useFakeTimers()

        screen.tree = withGeneral({ rect: { x: 16, y: 200, width: 370, height: 52 } })
        const waiting = waitForActionable(session, general)
        await vi.advanceTimersByTimeAsync(0)
        screen.tree = withGeneral({ rect: { x: 16, y: 100, width: 370, height: 52 } })
        await vi.advanceTimersByTimeAsync(100)

        expect((await waiting).rect.y).toBe(100)
        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui'])
    })

    it('does not take an element for stable that moved since it was found', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL, { justNow: true })
        fetchMock.mockClear()

        screen.tree = withGeneral({ rect: { x: 16, y: 100, width: 370, height: 52 } })

        expect((await waitForActionable(session, general)).rect.y).toBe(100)
        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui'])
    })

    it('uses an element that keeps moving where it is when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)

        screen.tree = withGeneral({ rect: { x: 16, y: 200, width: 370, height: 52 } })

        expect((await waitForActionable(session, general)).rect.y).toBe(200)
    })

    it('waits for an element that is not on the screen yet', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)
        fetchMock.mockClear()
        vi.useFakeTimers()

        screen.tree = undefined
        const waiting = waitForActionable(session, general)
        await vi.advanceTimersByTimeAsync(150)
        screen.tree = IOS_TREE
        await vi.advanceTimersByTimeAsync(100)

        expect((await waiting).ref).toBe('@e4')
    })

    it.each([
        ['no matching element found', undefined],
        ['element found but not visible', withGeneral({ rect: { x: 0, y: 0, width: 0, height: 0 } })],
        ['element found but not visible', withGeneral({ visible: false })],
        ['element found but not enabled', withGeneral({ enabled: false })]
    ])('fails with "%s" after the timeout of WebdriverIO', async (reason, tree) => {
        const session = createSession(undefined, { timeout: 2000, interval: 100 })
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)
        fetchMock.mockClear()
        vi.useFakeTimers()

        screen.tree = tree
        const waiting = waitForActionable(session, general).catch((err) => err)
        await vi.advanceTimersByTimeAsync(1900)
        expect(fetchMock.mock.calls.length).toBeGreaterThan(15)
        await vi.advanceTimersByTimeAsync(200)

        expect(await waiting).toEqual(expect.objectContaining({
            name: 'MobilecliTimeoutError',
            message: `Element with the selector "${GENERAL}" (accessibility id): ${reason} after 2000ms`
        }))
    })
})

describe('waitForVisible', () => {
    it('returns a visible element after one look, also if it is not enabled or moves', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)
        fetchMock.mockClear()

        screen.tree = withGeneral({ enabled: false, rect: { x: 16, y: 200, width: 370, height: 52 } })

        expect((await waitForVisible(session, general)).rect.y).toBe(200)
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })

    it('fails if the element is not visible when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', GENERAL)

        screen.tree = withGeneral({ visible: false })

        await expect(waitForVisible(session, general)).rejects.toThrow(
            `Element with the selector "${GENERAL}" (accessibility id): element found but not visible after 0ms`
        )
    })
})
