import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { getElementProperty } from '../../../src/commands/element/getElementProperty.js'
import { mockServer } from '../../__fixtures__/server.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { INPUT, NO_WAIT, createSession, findElementId, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('getElementProperty', () => {
    it('reads the value for getValue()', async () => {
        const session = createSession()
        mockServer({ 'device.dump.ui': () => ({ elements: [{ ...INPUT, value: 'Hello' }] }) })

        expect(await getElementProperty(session, await findElementId(session, 'accessibility id', 'text-input'), 'value')).toBe('Hello')
    })

    it('returns an empty string for an element without a value', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        expect(await getElementProperty(session, await findElementId(session, 'accessibility id', 'General'), 'value')).toBe('')
    })

    it('has no other properties', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'General')
        fetchMock.mockClear()

        await expect(getElementProperty(session, general, 'label'))
            .rejects.toThrow('The property "label" is not supported by @wdio/mobilecli-driver, only "value" is.')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails if the element is not on the screen when the time is up', async () => {
        const session = createSession(undefined, NO_WAIT)
        const { screen } = mockScreen(IOS_TREE)
        const general = await findElementId(session, 'accessibility id', 'General')

        screen.tree = undefined

        await expect(getElementProperty(session, general, 'value')).rejects.toThrow(expect.objectContaining({ name: 'MobilecliTimeoutError' }))
    })
})
