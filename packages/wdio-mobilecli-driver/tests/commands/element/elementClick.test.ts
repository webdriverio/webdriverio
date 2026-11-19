import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { elementClick } from '../../../src/commands/element/elementClick.js'
import { IOS_DEVICE, ServerError, mockServer } from '../../__fixtures__/server.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { NO_WAIT, createSession, findElementId, getMethods, getTaps, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('elementClick', () => {
    it('taps in the middle of the element', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        expect(await elementClick(session, general)).toBe(null)

        /**
         * rect: { x: 16, y: 293, width: 370, height: 52 }
         */
        expect(getTaps(fetchMock)).toEqual([{ deviceId: IOS_DEVICE.id, x: 201, y: 319 }])
    })

    it('taps where the element is now, not where it was found', async () => {
        const session = createSession()
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        const moved = structuredClone(IOS_TREE)
        moved[1].children![0].rect.y = 93
        screen.tree = moved
        await elementClick(session, general)

        expect(getTaps(fetchMock)).toEqual([{ deviceId: IOS_DEVICE.id, x: 201, y: 119 }])
    })

    it('sends whole numbers, as mobilecli does not take other numbers', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)

        /**
         * rect: { x: 360, y: 313, width: 7, height: 12 }
         */
        await elementClick(session, await findElementId(session, 'accessibility id', 'chevron.forward'))

        expect(getTaps(fetchMock)).toEqual([{ deviceId: IOS_DEVICE.id, x: 364, y: 319 }])
    })

    it('looks at the screen twice to know that the element does not move', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')
        fetchMock.mockClear()

        await elementClick(session, general)

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'io.tap'])
    })

    it('looks once if the element was found right before, as that was the first look', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general', { justNow: true })
        fetchMock.mockClear()

        await elementClick(session, general)

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'io.tap'])
    })

    it('does not use what it saw before a tap', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general', { justNow: true })
        await elementClick(session, general)
        fetchMock.mockClear()

        await elementClick(session, general)

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'io.tap'])
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen, fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'com.apple.settings.general')

        screen.tree = [IOS_TREE[0]]

        await expect(elementClick(session, general)).rejects.toThrow(expect.objectContaining({
            name: 'MobilecliTimeoutError',
            message: 'Element with the selector "com.apple.settings.general" (accessibility id): no matching element found after 0ms'
        }))
        expect(getTaps(fetchMock)).toEqual([])
    })

    it('does not tap an element without a size, it is not visible', async () => {
        const session = createSession(undefined, NO_WAIT)
        const tree = structuredClone(IOS_TREE)
        tree[1].children![0].rect = { x: 0, y: 0, width: 0, height: 0 }
        const { fetchMock } = mockScreen(tree)

        await expect(elementClick(session, await findElementId(session, 'accessibility id', 'com.apple.settings.general')))
            .rejects.toThrow(expect.objectContaining({
                name: 'MobilecliTimeoutError',
                message: 'Element with the selector "com.apple.settings.general" (accessibility id): element found but not visible after 0ms'
            }))
        expect(getTaps(fetchMock)).toEqual([])
    })

    it('throws the error of mobilecli if the tap fails', async () => {
        const session = createSession()
        mockServer({
            'device.dump.ui': () => ({ elements: IOS_TREE }),
            'device.io.tap': () => {
                throw new ServerError('failed to tap on device: agent not running')
            }
        })

        await expect(elementClick(session, await findElementId(session, 'accessibility id', 'com.apple.settings.general')))
            .rejects.toThrow('failed to tap on device: agent not running')
    })
})
