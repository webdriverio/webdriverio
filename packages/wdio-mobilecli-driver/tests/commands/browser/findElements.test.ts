import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { findElement } from '../../../src/commands/browser/findElement.js'
import { findElements } from '../../../src/commands/browser/findElements.js'
import { elementClick } from '../../../src/commands/element/elementClick.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { ELEMENT_KEY, createSession, getMethods, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

type Reference = Record<string, string>

describe('findElements', () => {
    it('finds all elements that the selector matches, in the order of the UI tree', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        const elements = await findElements(session, 'class name', 'XCUIElementTypeButton') as Reference[]

        expect(elements.map((element) => session.elements.resolve(element[ELEMENT_KEY], IOS_TREE, 'ios').ref))
            .toEqual(['@e4', '@e7'])
        expect(elements[0]).toEqual(await findElement(session, 'class name', 'XCUIElementTypeButton'))
    })

    it('returns no elements if nothing matches or the screen is empty', async () => {
        const session = createSession()
        const { screen } = mockScreen(IOS_TREE)

        expect(await findElements(session, 'accessibility id', 'nope')).toEqual([])

        screen.tree = undefined
        expect(await findElements(session, 'accessibility id', 'nope')).toEqual([])
    })

    describe('finds that share a look at the screen', () => {
        it('finds another selector in the look of the find before it', async () => {
            const session = createSession()
            const { fetchMock } = mockScreen(IOS_TREE)

            await findElements(session, 'accessibility id', 'Settings')
            expect(await findElements(session, 'accessibility id', 'General')).toHaveLength(1)
            expect(await findElements(session, 'class name', 'XCUIElementTypeButton')).toHaveLength(2)

            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        it('finds the same selector once more in the same look, as WebdriverIO does after a wait', async () => {
            const session = createSession()
            const { fetchMock } = mockScreen(IOS_TREE)

            const elements = await findElements(session, 'accessibility id', 'Settings')
            expect(await findElements(session, 'accessibility id', 'Settings')).toEqual(elements)

            expect(fetchMock).toHaveBeenCalledTimes(1)
        })

        it('looks again for a selector that it searched twice: WebdriverIO waits until it is gone', async () => {
            const session = createSession()
            const { screen, fetchMock } = mockScreen(IOS_TREE)

            await findElements(session, 'accessibility id', 'Settings')
            await findElements(session, 'accessibility id', 'Settings')
            screen.tree = undefined
            expect(await findElements(session, 'accessibility id', 'Settings')).toEqual([])

            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it('looks again if the selector does not match: the element may have come since', async () => {
            const session = createSession()
            const { screen, fetchMock } = mockScreen([IOS_TREE[0]])

            await findElements(session, 'accessibility id', 'Settings')
            screen.tree = IOS_TREE
            expect(await findElements(session, 'accessibility id', 'General')).toHaveLength(1)

            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it('looks again if the last look is more than 100 ms old', async () => {
            const session = createSession()
            const { fetchMock } = mockScreen(IOS_TREE)
            vi.useFakeTimers()

            await findElements(session, 'accessibility id', 'Settings')
            vi.advanceTimersByTime(101)
            await findElements(session, 'accessibility id', 'General')

            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it('does not share a look with the setting screenFreshTime of 0', async () => {
            const session = createSession(undefined, undefined, { screenFreshTime: 0 })
            const { fetchMock } = mockScreen(IOS_TREE)

            const [settings] = await findElements(session, 'accessibility id', 'Settings') as Reference[]
            await findElements(session, 'accessibility id', 'General')
            expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui'])

            /**
             * and a command reads the screen itself, it does not use what the
             * find saw. The find still counts as the first of the two looks
             * that show the element at the same place, if it was in an
             * earlier millisecond: so one or two looks before the tap.
             */
            fetchMock.mockClear()
            await elementClick(session, settings[ELEMENT_KEY])
            const methods = getMethods(fetchMock)
            expect(methods[0]).toBe('dump.ui')
            expect(methods.at(-1)).toBe('io.tap')
            expect(methods.filter((method) => method === 'dump.ui').length).toBeLessThanOrEqual(2)
        })

        it('searches a selector as often in one look as the setting maxSearchesPerScreen says', async () => {
            const session = createSession(undefined, undefined, { maxSearchesPerScreen: 1 })
            const { fetchMock } = mockScreen(IOS_TREE)

            await findElements(session, 'accessibility id', 'Settings')
            await findElements(session, 'accessibility id', 'General')
            expect(fetchMock).toHaveBeenCalledTimes(1)

            await findElements(session, 'accessibility id', 'Settings')
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it('looks again after the driver did something on the screen', async () => {
            const session = createSession()
            const { fetchMock } = mockScreen(IOS_TREE)

            const [settings] = await findElements(session, 'accessibility id', 'Settings') as Reference[]
            await elementClick(session, settings[ELEMENT_KEY])
            fetchMock.mockClear()
            await findElements(session, 'accessibility id', 'General')

            expect(getMethods(fetchMock)).toEqual(['dump.ui'])
        })

        it('does not take a shared look for a second look at an element', async () => {
            const session = createSession()
            const { fetchMock } = mockScreen(IOS_TREE)

            await findElements(session, 'accessibility id', 'Settings')
            const [general] = await findElements(session, 'accessibility id', 'General') as Reference[]
            fetchMock.mockClear()
            await elementClick(session, general[ELEMENT_KEY])

            expect(getMethods(fetchMock)).toEqual(['dump.ui', 'io.tap'])
        })
    })

    it('throws an invalid selector error for a strategy that is not supported', async () => {
        const { fetchMock } = mockScreen(IOS_TREE)

        await expect(findElements(createSession(), 'xpath', '//XCUIElementTypeButton'))
            .rejects.toThrow(expect.objectContaining({ name: 'invalid selector' }))
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
