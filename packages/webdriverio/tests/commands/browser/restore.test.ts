import path from 'node:path'

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager () {
        return {
            initialize: async () => '',
            getCurrentTopLevelContext: async () => 'ctx-1'
        }
    }
}))

const { remote } = await import('../../../src/index.js')

const browserA = await remote({
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar'
    }
})

const browserB = await remote({
    baseUrl: 'http://foobar.com',
    capabilities: {
        browserName: 'foobar'
    }
})

const fakeScope = {
    isBidi: true,
    emulationSetGeolocationOverride: vi.fn(),
    emulationSetUserAgentOverride: vi.fn(),
    emulationSetMediaFeaturesOverride: vi.fn(),
    emulationSetNetworkConditions: vi.fn(),
    options: {
        beforeCommand: vi.fn(),
        afterCommand: vi.fn()
    }
} as unknown as WebdriverIO.Browser

const scopeBrowserA = {
    ...fakeScope,
    emulate: browserA.emulate.bind(browserA)
}

const scopeBrowserB = {
    ...fakeScope,
    emulate: browserB.emulate.bind(browserB)
}

const CONTEXTS = ['ctx-1']

describe('restore', () => {
    beforeEach(() => {
        vi.mocked(fakeScope.emulationSetGeolocationOverride).mockClear()
        vi.mocked(fakeScope.emulationSetUserAgentOverride).mockClear()
        vi.mocked(fakeScope.emulationSetMediaFeaturesOverride).mockClear()
        vi.mocked(fakeScope.emulationSetNetworkConditions).mockClear()
    })

    it('should restore all emulated behavior', async () => {
        await browserA.emulate.call(scopeBrowserA, 'geolocation', { latitude: 52.52, longitude: 13.405 })
        await browserA.emulate.call(scopeBrowserA, 'userAgent', 'foobar')
        await browserA.emulate.call(scopeBrowserA, 'colorScheme', 'dark')
        await browserB.emulate.call(scopeBrowserB, 'onLine', false)

        await browserB.restore.call(scopeBrowserB)
        expect(fakeScope.emulationSetNetworkConditions).toBeCalledWith({ networkConditions: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledTimes(1)

        await browserA.restore.call(scopeBrowserA)
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({ coordinates: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetUserAgentOverride).toBeCalledWith({ userAgent: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetMediaFeaturesOverride).toBeCalledWith({ features: null, contexts: CONTEXTS })
    })

    it('should restore specific emulated behavior', async () => {
        await browserA.emulate.call(scopeBrowserA, 'geolocation', { latitude: 52.52, longitude: 13.405 })
        await browserA.emulate.call(scopeBrowserA, 'userAgent', 'foobar')
        await browserA.emulate.call(scopeBrowserA, 'colorScheme', 'dark')
        await browserA.emulate.call(scopeBrowserA, 'onLine', false)
        await browserA.restore.call(scopeBrowserA, ['geolocation', 'userAgent'])
        expect(fakeScope.emulationSetGeolocationOverride).toBeCalledWith({ coordinates: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetUserAgentOverride).toBeCalledWith({ userAgent: null, contexts: CONTEXTS })
        expect(fakeScope.emulationSetMediaFeaturesOverride).toBeCalledTimes(1)
        expect(fakeScope.emulationSetNetworkConditions).toBeCalledTimes(1)
    })
})
