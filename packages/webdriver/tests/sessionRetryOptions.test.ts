import { describe, it, expect } from 'vitest'
import { validateConfig } from '@wdio/config'
import type { Options } from '@wdio/types'

import '../src/browser.js'
import { environment } from '../src/environment.js'
import { DEFAULTS } from '../src/constants.js'
import { startWebDriverSession } from '../src/utils.js'
import type { RemoteConfig } from '../src/types.js'

/**
 * Capture the options passed to POST /session without starting a grid or browser.
 * This is intentionally limited to the session boundary, not a full browser suite.
 */
async function captureNewSession(options: Partial<Options.WebDriver>) {
    const originalRequest = environment.value.Request
    const calls: Array<Options.WebDriver> = []

    class FakeSessionRequest {
        async makeRequest(requestOptions: Options.WebDriver) {
            calls.push(requestOptions)
            return {
                value: {
                    sessionId: 'created-session',
                    capabilities: { browserName: 'chrome' }
                }
            }
        }
    }

    environment.value.Request = FakeSessionRequest as unknown as typeof originalRequest
    const params = { ...options, capabilities: { browserName: 'chrome' } } as RemoteConfig

    try {
        const session = await startWebDriverSession(params)
        return { calls, params, session }
    } finally {
        environment.value.Request = originalRequest
    }
}

describe('session-only WebDriver request retries', () => {
    it('uses the session overrides, preserving normal command configuration', async () => {
        const { calls, params, session } = await captureNewSession({
            connectionRetryTimeout: 5000,
            connectionRetryCount: 0,
            sessionConnectionRetryTimeout: 180000,
            sessionConnectionRetryCount: 2
        })

        expect(session.sessionId).toBe('created-session')
        expect(calls).toHaveLength(1)
        expect(calls[0]).toMatchObject({
            connectionRetryTimeout: 180000,
            connectionRetryCount: 2
        })
        // Normal requests continue to receive params, not the session override.
        expect(params.connectionRetryTimeout).toBe(5000)
        expect(params.connectionRetryCount).toBe(0)
    })

    it('falls back to regular timeout/retry settings, including zero retries', async () => {
        const { calls } = await captureNewSession({
            connectionRetryTimeout: 7000,
            connectionRetryCount: 0
        })
        expect(calls[0]).toMatchObject({
            connectionRetryTimeout: 7000,
            connectionRetryCount: 0
        })
    })

    it('accepts valid overrides and rejects invalid numeric settings', () => {
        const base = { capabilities: { browserName: 'chrome' } }
        const accepted = validateConfig(DEFAULTS, {
            ...base,
            sessionConnectionRetryTimeout: 180000,
            sessionConnectionRetryCount: 0
        })
        expect(accepted.sessionConnectionRetryTimeout).toBe(180000)
        expect(accepted.sessionConnectionRetryCount).toBe(0)

        expect(() => validateConfig(DEFAULTS, {
            ...base,
            sessionConnectionRetryTimeout: 0
        })).toThrow('sessionConnectionRetryTimeout')
        expect(() => validateConfig(DEFAULTS, {
            ...base,
            sessionConnectionRetryCount: -1
        })).toThrow('sessionConnectionRetryCount')
    })
})
