import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import PWAGatherer from '../../src/gatherer/pwa.js'
import type { GathererDriver } from '../../src/types.js'

vi.mock('lighthouse/lighthouse-core/fraggle-rock/gather/session')
vi.mock('lighthouse/lighthouse-core/gather/gatherers/installability-errors')
vi.mock('lighthouse/lighthouse-core/gather/gatherers/web-app-manifest')
vi.mock('lighthouse/lighthouse-core/gather/gatherers/link-elements')
vi.mock('lighthouse/lighthouse-core/gather/gatherers/viewport-dimensions')
vi.mock('lighthouse/lighthouse-core/gather/driver/service-workers')

const pageMock = {
    on: vi.fn(),
    url: vi.fn().mockResolvedValue('http://json.org')
} as unknown as Page
const sessionMock = {
    on: vi.fn(),
    send: vi.fn(),
    _connection: { _transport: { _ws: { addEventListener: vi.fn() } } }
} as unknown as CDPSession

const driver = {
    evaluate: vi.fn()
} as any as GathererDriver

describe('PWAGatherer', () => {
    beforeEach(() => {
        vi.mocked(sessionMock.on).mockClear()
        vi.mocked(pageMock.on).mockClear()
    })

    it('initiates properly', () => {
        const pwaGatherer = new PWAGatherer(sessionMock, pageMock, driver)
        expect(vi.mocked(sessionMock.on).mock.calls.map((c) => c[0]))
            .toMatchSnapshot()
        pwaGatherer['_networkRecorder'].dispatch({ method: 'Network.requestWillBeSent', params: 'bar' })
        expect(pwaGatherer['_networkRecords']).toHaveLength(0)
        expect(pwaGatherer['_networkRecorder'].getRawRecords()).toHaveLength(1)
        vi.mocked(pageMock.on).mock.calls[0][1]({} as any)
        expect(pwaGatherer['_networkRecords']).toHaveLength(1)
        expect(pwaGatherer['_networkRecorder'].getRawRecords()).toHaveLength(0)
    })

    it('gatherData', async () => {
        const pwaGatherer = new PWAGatherer(sessionMock, pageMock, driver)
        pwaGatherer['_driver'].evaluate = vi.fn().mockResolvedValue({ some: 'result' })
        expect(await pwaGatherer.gatherData()).toMatchSnapshot()
    })
})
