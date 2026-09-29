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
        const sent: { command: string, params?: unknown }[] = []
        const store = new Map<string, unknown>()
        const session = {
            isBidi: false,
            applies: ['W'],
            browser: {
                capabilities: { browserName: 'electron' },
                execute: async (script: unknown) => {
                    executed.push(script)
                    if (typeof script === 'function') {
                        return store.get('geo-permission') ?? 'prompt'
                    }
                },
                sendCommandAndGetResult: async (command: string, params?: unknown) => {
                    commands.push(command)
                    sent.push({ command, params })
                    if (command === 'Page.addScriptToEvaluateOnNewDocument') {
                        return { identifier: `script-${commands.length}` }
                    }
                },
                sendCommand: async (command: string, params?: unknown) => {
                    commands.push(command)
                    sent.push({ command, params })
                    if (command === 'Browser.setPermission' && store.get('fail-permission')) {
                        throw new Error('setPermission failed')
                    }
                },
                getUrl: async () => 'http://127.0.0.1:8081/'
            },
            get: (key: string) => store.get(key),
            set: (key: string, value: unknown) => store.set(key, value),
            requireBidi () {
                throw new Error('BIDI_REQUIRED')
            }
        }
        return { session: session as unknown as Session, executed, commands, sent, store }
    }

    it('sets the clock through the page when BiDi is absent', async () => {
        const { session, executed, commands } = classicSession()
        const result = await emulate(session, { sub: 'clock', value: '2026-06-21T23:30:00.000Z' })
        expect(result.text).toContain('2026-06-21T23:30:00.000Z')
        expect(executed).toHaveLength(1)
        expect(String(executed[0])).toContain('new Proxy')
        expect(result.code).toContain('new Proxy')
        expect(result.code).not.toContain('/*')
        expect(result.code).not.toContain('addScriptToEvaluateOnNewDocument')
        expect(result.history).toContain('Page.addScriptToEvaluateOnNewDocument')
        expect(result.history).toContain(result.code)
        expect(commands).toContain('Page.addScriptToEvaluateOnNewDocument')
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
        expect(commands).toContain('Page.addScriptToEvaluateOnNewDocument')
        expect(result.code).toContain('setGeolocationOverride')
        expect(result.code).not.toContain('addScriptToEvaluateOnNewDocument')
        expect(result.history).toContain('addScriptToEvaluateOnNewDocument')
        expect(result.history).toContain('navigator')
        expect(executed.filter((script) => typeof script === 'string')).toHaveLength(1)
    })

    it('drops the classic clock and geolocation when the session resets', async () => {
        const { session, commands, executed } = classicSession()
        await emulate(session, { sub: 'clock', value: '2026-06-21T23:30:00.000Z' })
        await geolocation(session, { lat: '35.6762', lon: '139.6503' })
        await emulate(session, { sub: 'reset' })
        expect(commands).toContain('Page.removeScriptToEvaluateOnNewDocument')
        expect(commands).toContain('Emulation.clearGeolocationOverride')
        expect(commands).toContain('Browser.setPermission')
        expect(commands).not.toContain('Browser.resetPermissions')
        expect(executed.some((script) => String(script).includes('__wdioNativeDate'))).toBe(true)
        expect(executed.some((script) => String(script).includes('delete navigator.geolocation'))).toBe(true)
    })

    it('puts the previous geolocation permission back', async () => {
        const { session, commands, sent, store } = classicSession()
        store.set('geo-permission', 'granted')
        await geolocation(session, { lat: '35.6762', lon: '139.6503' })
        await emulate(session, { sub: 'reset' })
        const permission = sent.find((entry) => entry.command === 'Browser.setPermission')
        expect(permission?.params).toMatchObject({
            setting: 'granted',
            origin: 'http://127.0.0.1:8081',
            permission: { name: 'geolocation' }
        })
        expect(commands).not.toContain('Browser.resetPermissions')
    })

    it('restores prompt when the previous geolocation permission cannot be read', async () => {
        const { session, commands, sent, store } = classicSession()
        store.set('geo-permission', '')
        await geolocation(session, { lat: '35.6762', lon: '139.6503' })
        await emulate(session, { sub: 'reset' })
        const restores = sent.filter((entry) => entry.command === 'Browser.setPermission')
        expect(restores.at(-1)?.params).toMatchObject({
            setting: 'prompt',
            origin: 'http://127.0.0.1:8081',
            permission: { name: 'geolocation' }
        })
        expect(commands).not.toContain('Browser.resetPermissions')
    })

    it('resets permissions when the per-origin restore fails', async () => {
        const { session, commands, store } = classicSession()
        store.set('fail-permission', true)
        await geolocation(session, { lat: '35.6762', lon: '139.6503' })
        await emulate(session, { sub: 'reset' })
        expect(commands).toContain('Browser.setPermission')
        expect(commands).toContain('Browser.resetPermissions')
    })

    it('advances the classic clock without installing BiDi fake timers', async () => {
        const { session, executed } = classicSession()
        await emulate(session, { sub: 'clock', value: '2030-01-01T00:00:00.000Z' })
        const result = await emulate(session, { sub: 'clock', tick: 60000 })
        expect(result.text).toBe('Clock advanced by 60000ms')
        expect(String(executed.at(-1))).toContain(String(Date.parse('2030-01-01T00:00:00.000Z') + 60000))
    })

    it('removes the preloaded clock script on reset', async () => {
        const { session, sent } = classicSession()
        await emulate(session, { sub: 'clock', value: '2030-01-01T00:00:00.000Z' })
        await emulate(session, { sub: 'reset' })
        const removed = sent.find((entry) => entry.command === 'Page.removeScriptToEvaluateOnNewDocument')
        expect(removed?.params).toEqual({ identifier: 'script-1' })
    })
})

describe('NETWORK_PRESETS', () => {
    it('keeps Regular3G at 100ms with the documented throughputs', () => {
        expect(NETWORK_PRESETS.Regular3G).toEqual({ latency: 100, download_throughput: 96000, upload_throughput: 32000 })
        expect(Object.keys(NETWORK_PRESETS)).toEqual(['GPRS', 'Regular2G', 'Good2G', 'Regular3G', 'Good3G', 'Regular4G', 'DSL', 'WiFi'])
    })
})
