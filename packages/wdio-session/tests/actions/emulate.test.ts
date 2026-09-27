import { describe, it, expect } from 'vitest'

import { findDevice, NETWORK_PRESETS, parseViewport } from '../../src/actions/emulate.js'

describe('parseViewport', () => {
    it('parses width and height', () => {
        expect(parseViewport('1280x720')).toEqual({ width: 1280, height: 720 })
    })

    it('rejects other shapes', () => {
        expect(() => parseViewport('big')).toThrow('Invalid viewport "big".')
        expect(() => parseViewport('1280')).toThrow(/Invalid viewport/)
    })
})

describe('findDevice', () => {
    it('matches device names case-insensitively', () => {
        expect(findDevice('iPhone 15')).toBe('iPhone 15')
        expect(findDevice('iphone 15')).toBe('iPhone 15')
        expect(findDevice('no such phone')).toBeUndefined()
    })
})

describe('NETWORK_PRESETS', () => {
    it('keeps Regular3G at 100ms with the documented throughputs', () => {
        expect(NETWORK_PRESETS.Regular3G).toEqual({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })
        expect(Object.keys(NETWORK_PRESETS)).toEqual(['GPRS', 'Regular2G', 'Good2G', 'Regular3G', 'Good3G', 'Regular4G', 'DSL', 'WiFi'])
    })
})
