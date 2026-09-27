import { describe, it, expect } from 'vitest'

import { emulate, findDevice, NETWORK_PRESETS, parseViewport } from '../../src/actions/emulate.js'
import type { Session } from '../../src/session.js'

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

describe('emulate replacement', () => {
    it('puts the previous CPU rate back when the new one fails', async () => {
        const rates: number[] = []
        const store = new Map<string, unknown>()
        const session = {
            browser: {
                capabilities: { browserName: 'chrome' },
                sendCommand: async (_command: string, params: { rate: number }) => {
                    rates.push(params.rate)
                    if (params.rate === 8) {
                        throw new Error('rejected')
                    }
                }
            },
            get: (key: string) => store.get(key),
            set: (key: string, value: unknown) => store.set(key, value)
        } as unknown as Session
        await emulate(session, { sub: 'cpu', value: '4' })
        await expect(emulate(session, { sub: 'cpu', value: '8' })).rejects.toThrow('rejected')
        expect(rates).toEqual([4, 1, 8, 4])
        await emulate(session, { sub: 'reset' })
        expect(rates.at(-1)).toBe(1)
    })
})

describe('NETWORK_PRESETS', () => {
    it('keeps Regular3G at 100ms with the documented throughputs', () => {
        expect(NETWORK_PRESETS.Regular3G).toEqual({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })
        expect(Object.keys(NETWORK_PRESETS)).toEqual(['GPRS', 'Regular2G', 'Good2G', 'Regular3G', 'Good3G', 'Regular4G', 'DSL', 'WiFi'])
    })
})
