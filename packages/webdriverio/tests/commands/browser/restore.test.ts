import path from 'node:path'

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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
    scriptAddPreloadScript: vi.fn().mockResolvedValue({ script: 'foobar' }),
    scriptRemovePreloadScript: vi.fn(),
    addInitScript: vi.fn(),
    execute: vi.fn().mockResolvedValue({}),
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

describe('restore', () => {
    beforeEach(() => {
        vi.mocked(fakeScope.scriptRemovePreloadScript).mockClear()
    })

    it('should restore all emulated behavior', async () => {
        await browserA.emulate.call(scopeBrowserA, 'geolocation', { latitude: 52.52, longitude: 13.405 })
        await browserA.emulate.call(scopeBrowserA, 'userAgent', 'foobar')
        await browserA.emulate.call(scopeBrowserA, 'colorScheme', 'dark')
        await browserB.emulate.call(scopeBrowserB, 'onLine', false)

        await browserB.restore.call(scopeBrowserB)
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(1)
        await browserA.restore.call(scopeBrowserA)
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(4)
    })

    it('should restore specific emulated behavior', async () => {
        await browserA.emulate.call(scopeBrowserA, 'geolocation', { latitude: 52.52, longitude: 13.405 })
        await browserA.emulate.call(scopeBrowserA, 'userAgent', 'foobar')
        await browserA.emulate.call(scopeBrowserA, 'colorScheme', 'dark')
        await browserA.emulate.call(scopeBrowserA, 'onLine', false)
        await browserA.restore.call(scopeBrowserA, ['geolocation', 'userAgent'])
        expect(fakeScope.scriptRemovePreloadScript).toBeCalledTimes(2)
    })
})
