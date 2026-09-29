import { describe, it, expect } from 'vitest'

import { emulate, findDevice, geolocation, NETWORK_PRESETS, parseViewport } from '../../src/actions/emulate.js'
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

describe('classic chromium emulation', () => {
    function classicSession () {
        const executed: unknown[] = []
        const commands: string[] = []
        const store = new Map<string, unknown>()
        const session = {
            isBidi: false,
            applies: ['W'],
            browser: {
                capabilities: { browserName: 'electron' },
                execute: async (script: unknown) => {
                    executed.push(script)
                },
                sendCommand: async (command: string) => {
                    commands.push(command)
                },
                getUrl: async () => 'http://127.0.0.1:8081/'
            },
            get: (key: string) => store.get(key),
            set: (key: string, value: unknown) => store.set(key, value),
            requireBidi () {
                throw new Error('BIDI_REQUIRED')
            }
        }
        return { session: session as unknown as Session, executed, commands }
    }

    it('sets the clock through the page when BiDi is absent', async () => {
        const { session, executed } = classicSession()
        const result = await emulate(session, { sub: 'clock', value: '2026-06-21T23:30:00.000Z' })
        expect(result.text).toContain('2026-06-21T23:30:00.000Z')
        expect(executed).toHaveLength(1)
    })

    it('patches Date on Chromium instead of installing BiDi fake timers', async () => {
        const { session, executed } = classicSession()
        ;(session as { isBidi: boolean }).isBidi = true
        ;(session.browser as { emulate?: () => Promise<unknown> }).emulate = async () => {
            throw new Error('fake timers should not be installed')
        }
        const result = await emulate(session, { sub: 'clock', value: '2026-06-21T23:30:00.000Z' })
        expect(result.text).toContain('2026-06-21T23:30:00.000Z')
        expect(executed.length).toBeGreaterThan(0)
    })

    it('keeps the latest clock when emulate clock runs twice', async () => {
        const { session, executed } = classicSession()
        await emulate(session, { sub: 'clock', value: '2026-06-21T14:00:00.000Z' })
        const result = await emulate(session, { sub: 'clock', value: '2026-06-21T23:30:00.000Z' })
        expect(result.text).toContain('2026-06-21T23:30:00.000Z')
        // restore of the first clock, then install of the second
        expect(executed.length).toBeGreaterThanOrEqual(2)
    })

    it('sets geolocation through CDP when BiDi is absent', async () => {
        const { session, commands, executed } = classicSession()
        const result = await geolocation(session, { lat: '35.6762', lon: '139.6503' })
        expect(result.text).toContain('35.6762, 139.6503')
        expect(commands).toContain('Emulation.setGeolocationOverride')
        expect(executed).toHaveLength(1)
    })
})

describe('NETWORK_PRESETS', () => {
    it('keeps Regular3G at 100ms with the documented throughputs', () => {
        expect(NETWORK_PRESETS.Regular3G).toEqual({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })
        expect(Object.keys(NETWORK_PRESETS)).toEqual(['GPRS', 'Regular2G', 'Good2G', 'Regular3G', 'Good3G', 'Regular4G', 'DSL', 'WiFi'])
    })
})
