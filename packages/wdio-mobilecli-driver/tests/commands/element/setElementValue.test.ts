import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { setElementValue } from '../../../src/commands/element/setElementValue.js'
import { IOS_DEVICE, getRequests, mockServer } from '../../__fixtures__/server.js'
import { NO_WAIT, createSession, findElementId, getMethods, mockInput } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('setElementValue', () => {
    const find = (session: ReturnType<typeof createSession>, options?: { justNow: boolean }) => (
        findElementId(session, 'accessibility id', 'text-input', options)
    )

    it('taps the element for the focus and sets the text in one call, as locator.fill() of Mobilewright', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const input = await find(session, { justNow: true })
        fetchMock.mockClear()

        expect(await setElementValue(session, input, 'Hello')).toBe(null)

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.dump.ui', params: { deviceId: IOS_DEVICE.id } },
            { method: 'device.io.tap', params: { deviceId: IOS_DEVICE.id, x: 201, y: 224 } },
            { method: 'device.io.fill', params: { deviceId: IOS_DEVICE.id, text: 'Hello' } }
        ])
    })

    it('does not wait for the focus: mobilecli fills the field itself', async () => {
        const session = createSession()
        const fetchMock = mockInput()

        await setElementValue(session, await find(session), 'Hello')

        expect(getMethods(fetchMock).slice(-2)).toEqual(['io.tap', 'io.fill'])
    })

    it('does not tap an element that has the focus: on iOS the tap opens the edit menu and the fill is lost', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focused: true })

        await setElementValue(session, await find(session), 'Hello')

        expect(getMethods(fetchMock)).not.toContain('io.tap')
        expect(getMethods(fetchMock).at(-1)).toBe('io.fill')
    })

    it('fills a number as text', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focused: true })

        await setElementValue(session, await find(session), 42 as unknown as string)

        expect(getRequests(fetchMock).at(-1)).toEqual({ method: 'device.io.fill', params: { deviceId: IOS_DEVICE.id, text: '42' } })
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        mockInput()
        const input = await find(session)
        const fetchMock = mockServer({ 'device.dump.ui': () => ({}) })

        await expect(setElementValue(session, input, 'Hello')).rejects.toThrow(expect.objectContaining({ name: 'MobilecliTimeoutError' }))
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })
})
