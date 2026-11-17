import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { elementClear } from '../../../src/commands/element/elementClear.js'
import { IOS_DEVICE, getRequests, mockServer } from '../../__fixtures__/server.js'
import { INPUT, NO_WAIT, createSession, findElementId, getMethods, mockInput } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('elementClear', () => {
    it('taps the element for the focus, empties the field that has it and checks that it is empty', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const input = await findElementId(session, 'accessibility id', 'text-input')

        expect(await elementClear(session, input)).toBe(null)

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui', 'io.tap', 'io.fill', 'dump.ui'])
        expect(getRequests(fetchMock).at(-2)).toEqual({ method: 'device.io.fill', params: { deviceId: IOS_DEVICE.id, text: '' } })
    })

    it('does not tap an element that has the focus: on iOS the tap opens the edit menu and the clear is lost', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focused: true })

        await elementClear(session, await findElementId(session, 'accessibility id', 'text-input'))

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui', 'io.fill', 'dump.ui'])
    })

    it('fails if the field still has a value after the clear', async () => {
        const session = createSession()
        const fetchMock = mockServer({
            'device.dump.ui': () => ({ elements: [{ ...INPUT, value: 'Hello' }] }),
            'device.io.tap': () => undefined,
            'device.io.fill': () => undefined
        })
        const input = await findElementId(session, 'accessibility id', 'text-input')

        await expect(elementClear(session, input)).rejects.toThrow(
            'Failed to clear the element with the selector "text-input" (accessibility id): it still has the value "Hello"'
        )
        expect(getMethods(fetchMock).slice(-2)).toEqual(['io.fill', 'dump.ui'])
    })

    it('does not fail if the element is gone after the clear', async () => {
        const session = createSession()
        const screen = { elements: [INPUT] as object[] }
        mockServer({
            'device.dump.ui': () => screen,
            'device.io.tap': () => undefined,
            'device.io.fill': () => {
                screen.elements = []
            }
        })

        expect(await elementClear(session, await findElementId(session, 'accessibility id', 'text-input'))).toBe(null)
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        mockInput()
        const input = await findElementId(session, 'accessibility id', 'text-input')
        const fetchMock = mockServer({ 'device.dump.ui': () => ({}) })

        await expect(elementClear(session, input)).rejects.toThrow(expect.objectContaining({ name: 'MobilecliTimeoutError' }))
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })
})
