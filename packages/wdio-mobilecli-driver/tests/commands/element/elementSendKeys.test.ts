import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { elementSendKeys } from '../../../src/commands/element/elementSendKeys.js'
import { IOS_DEVICE, getRequests, mockServer } from '../../__fixtures__/server.js'
import { NO_WAIT, createSession, findElementId, getMethods, mockInput } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('elementSendKeys', () => {
    const find = (session: ReturnType<typeof createSession>) => findElementId(session, 'accessibility id', 'text-input')

    it('taps the element, waits until it has the focus and types', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focusAfter: 1 })
        const input = await find(session)

        expect(await elementSendKeys(session, input, 'Hello')).toBe(null)

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui', 'io.tap', 'dump.ui', 'dump.ui', 'io.text'])
        expect(getRequests(fetchMock).slice(3)).toEqual(expect.arrayContaining([
            { method: 'device.io.tap', params: { deviceId: IOS_DEVICE.id, x: 201, y: 224 } },
            { method: 'device.io.text', params: { deviceId: IOS_DEVICE.id, text: 'Hello' } }
        ]))
    })

    it('does not tap an element that has the focus, so the cursor stays where it is', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focused: true })

        await elementSendKeys(session, await find(session), ' world')

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui', 'io.text'])
    })

    it('types a number as text', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focused: true })

        await elementSendKeys(session, await find(session), 42 as unknown as string)

        expect(getRequests(fetchMock).at(-1)).toEqual({ method: 'device.io.text', params: { deviceId: IOS_DEVICE.id, text: '42' } })
    })

    it('only gives the element the focus if there is no text', async () => {
        const session = createSession()
        const fetchMock = mockInput({ focusAfter: 0 })

        await elementSendKeys(session, await find(session), '')

        expect(getMethods(fetchMock)).toEqual(['dump.ui', 'dump.ui', 'dump.ui', 'io.tap', 'dump.ui'])
    })

    it('goes on after 3 seconds if the element never says that it has the focus', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const input = await find(session)
        vi.useFakeTimers()

        const typing = elementSendKeys(session, input, 'Hello')
        await vi.advanceTimersByTimeAsync(2900)
        expect(getMethods(fetchMock)).not.toContain('io.text')

        await vi.advanceTimersByTimeAsync(200)
        await typing
        expect(getMethods(fetchMock).at(-1)).toBe('io.text')
        expect(getMethods(fetchMock).filter((method) => method === 'io.tap')).toHaveLength(1)
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        mockInput()
        const input = await find(session)
        const fetchMock = mockServer({ 'device.dump.ui': () => ({}) })

        await expect(elementSendKeys(session, input, 'Hello')).rejects.toThrow(expect.objectContaining({ name: 'MobilecliTimeoutError' }))
        expect(getMethods(fetchMock)).toEqual(['dump.ui'])
    })
})
