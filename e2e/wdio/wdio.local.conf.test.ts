import { afterEach, describe, expect, test, vi } from 'vitest'

async function loadConfig () {
    vi.resetModules()
    const { config } = await import('./wdio.local.conf.js')
    return config
}

describe('wdio.local.conf browser selection', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    test('runs only the browsers named in WDIO_E2E_BROWSERS', async () => {
        vi.stubEnv('WDIO_E2E_BROWSERS', 'Chrome')
        const config = await loadConfig()
        expect((config.capabilities as WebdriverIO.Capabilities[]).map((cap) => cap.browserName)).toEqual(['chrome'])
    })

    test('throws when WDIO_E2E_BROWSERS matches no browser on this platform', async () => {
        vi.stubEnv('WDIO_E2E_BROWSERS', 'netscape')
        await expect(loadConfig()).rejects.toThrow(
            'WDIO_E2E_BROWSERS=netscape matches none of the browsers on this platform'
        )
    })
})
