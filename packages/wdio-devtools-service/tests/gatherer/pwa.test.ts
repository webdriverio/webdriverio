import type { CDPSession } from 'puppeteer-core/lib/cjs/puppeteer/common/Connection'
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'

import PWAGatherer from '../../src/gatherer/pwa'

const pageMock = {
    on: jest.fn(),
    url: jest.fn().mockResolvedValue('http://json.org')
} as unknown as Page
const sessionMock = {
    on: jest.fn(),
    send: jest.fn(),
    _connection: { _transport: { _ws: { addEventListener: jest.fn() } } }
} as unknown as CDPSession

describe('PWAGatherer', () => {
    beforeEach(() => {
        (sessionMock.on as jest.Mock).mockClear()
        ;(pageMock.on as jest.Mock).mockClear()
    })

    it('initiates properly', () => {
        const pwaGatherer = new PWAGatherer(sessionMock, pageMock)
        expect((sessionMock.on as jest.Mock).mock.calls.map((c) => c[0]))
            .toMatchSnapshot()
        pwaGatherer['_networkRecorder'].dispatch({ method: 'Network.requestWillBeSent', params: 'bar' })
        expect(pwaGatherer['_networkRecords']).toHaveLength(0)
        expect(pwaGatherer['_networkRecorder'].getRecords()).toHaveLength(1)
        ;(pageMock.on as jest.Mock).mock.calls[0][1]()
        expect(pwaGatherer['_networkRecords']).toHaveLength(1)
        expect(pwaGatherer['_networkRecorder'].getRecords()).toHaveLength(0)
    })

    it('gatherData', async () => {
        const pwaGatherer = new PWAGatherer(sessionMock, pageMock)
        pwaGatherer['_driver'].getServiceWorkerVersions = jest.fn().mockResolvedValue({ versions: '1.2.1' })
        pwaGatherer['_driver'].getServiceWorkerRegistrations = jest.fn().mockResolvedValue({ registrations: 42 })
        pwaGatherer['_driver'].evaluate = jest.fn().mockResolvedValue({ some: 'result' })
        expect(await pwaGatherer.gatherData()).toMatchSnapshot()
    })
})
