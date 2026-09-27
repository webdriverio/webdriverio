import { expect, test } from 'vitest'

import { NETWORK_STATES, PWA_AUDIT_NAMES, TRACE_COMMANDS } from '../src/constants.js'

test('keeps the Lighthouse-derived 3G throttling profiles', () => {
    expect(NETWORK_STATES['Regular 3G']).toEqual({
        offline: false,
        latency: 1125,
        downloadThroughput: 89600,
        uploadThroughput: 89600
    })
    expect(NETWORK_STATES['Good 3G']).toEqual({
        offline: false,
        latency: 562.5,
        downloadThroughput: 209715,
        uploadThroughput: 96000
    })
    expect(NETWORK_STATES.online.downloadThroughput).toBe(-1)
})

test('exposes the public PWA audit names', () => {
    expect(PWA_AUDIT_NAMES).toContain('isInstallable')
    expect(PWA_AUDIT_NAMES).toContain('maskableIcon')
    expect(TRACE_COMMANDS).toEqual(['click', 'navigateTo', 'url'])
})
