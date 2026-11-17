import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { getPageSource } from '../../../src/commands/browser/getPageSource.js'
import { IOS_DEVICE, getRequests } from '../../__fixtures__/server.js'
import { IOS_TREE } from '../../__fixtures__/trees.js'
import { createSession, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('getPageSource', () => {
    it('returns the UI tree of mobilecli as JSON', async () => {
        const { fetchMock } = mockScreen(IOS_TREE)

        const source = await getPageSource(createSession())

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.dump.ui', params: { deviceId: IOS_DEVICE.id } }
        ])
        expect(JSON.parse(source)).toEqual({ elements: IOS_TREE })
        expect(source).toContain('\n  "elements": [')
    })

    it('returns an empty list of elements for an empty screen', async () => {
        mockScreen()

        expect(JSON.parse(await getPageSource(createSession()))).toEqual({ elements: [] })
    })
})
