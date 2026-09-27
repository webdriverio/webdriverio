import { deviceDescriptorsSource, type DeviceName } from 'webdriverio'

import { notSupported, usage } from '../errors.js'
import { applyViewport, quote } from '../daemon/init.js'
import type { ActionFn, ActionOutcome, Session } from '../session.js'

type Restore = () => Promise<unknown>

interface Clock {
    tick: (ms: number) => Promise<void>
    setSystemTime: (date: Date | number) => Promise<void>
    restore: () => Promise<void>
}

/**
 * values of WebdriverIO's `throttleNetwork` presets, applied through
 * chromedriver so no Puppeteer is needed
 */
export const NETWORK_PRESETS: Record<string, { latency: number, download_throughput: number, upload_throughput: number }> = {
    GPRS: { latency: 500, download_throughput: 50 * 1024 / 8, upload_throughput: 20 * 1024 / 8 },
    Regular2G: { latency: 300, download_throughput: 250 * 1024 / 8, upload_throughput: 50 * 1024 / 8 },
    Good2G: { latency: 150, download_throughput: 450 * 1024 / 8, upload_throughput: 150 * 1024 / 8 },
    Regular3G: { latency: 100, download_throughput: 750 * 1024 / 8, upload_throughput: 250 * 1024 / 8 },
    Good3G: { latency: 40, download_throughput: 1.5 * 1024 * 1024 / 8, upload_throughput: 750 * 1024 / 8 },
    Regular4G: { latency: 20, download_throughput: 4 * 1024 * 1024 / 8, upload_throughput: 3 * 1024 * 1024 / 8 },
    DSL: { latency: 5, download_throughput: 2 * 1024 * 1024 / 8, upload_throughput: 1024 * 1024 / 8 },
    WiFi: { latency: 2, download_throughput: 30 * 1024 * 1024 / 8, upload_throughput: 15 * 1024 * 1024 / 8 }
}

const RELOAD_HINT = 'Reload the page to apply (`wdio session reload`).'

const done = (text: string, code: string): ActionOutcome => ({ text, code, history: code })

function restores (session: Session) {
    let map = session.get<Map<string, Restore>>('emulation')
    if (!map) {
        map = new Map()
        session.set('emulation', map)
    }
    return map
}

/**
 * Undo an emulation and forget it. `swap` does this before applying the
 * next one, so the new emulation is not undone by the previous restore.
 */
async function remember (session: Session, scope: string, restore: Restore | undefined) {
    const map = restores(session)
    const previous = map.get(scope)
    map.delete(scope)
    await previous?.().catch(() => {})
    if (restore) {
        map.set(scope, restore)
    }
}

async function swap (session: Session, scope: string, apply: () => Promise<unknown>) {
    await remember(session, scope, undefined)
    const restore = await apply()
    if (typeof restore === 'function') {
        restores(session).set(scope, restore as Restore)
    }
}

function isChromium (session: Session) {
    const name = String((session.browser.capabilities as WebdriverIO.Capabilities).browserName || '').toLowerCase()
    return ['chrome', 'chromium', 'msedge', 'microsoftedge', 'edge', 'electron'].some((n) => name.includes(n))
}

export function findDevice (name: string): DeviceName | undefined {
    const names = Object.keys(deviceDescriptorsSource) as DeviceName[]
    return names.find((n) => n === name) || names.find((n) => n.toLowerCase() === name.toLowerCase())
}

export function parseViewport (value: string) {
    const match = value.match(/^(\d+)x(\d+)$/)
    if (!match) {
        throw usage(`Invalid viewport "${value}".`, 'Use <width>x<height>, e.g. 1280x720.')
    }
    return { width: Number(match[1]), height: Number(match[2]) }
}

export const emulate: ActionFn = async (session, args) => {
    const sub = String(args.sub)
    const value = args.value === undefined ? undefined : String(args.value)
    const { browser } = session
    const needsValue = (what: string) => {
        if (!value) {
            throw usage(`\`emulate ${sub}\` needs ${what}.`)
        }
        return value
    }

    switch (sub) {
    case 'device': {
        if (!value) {
            const names = Object.keys(deviceDescriptorsSource)
            return { text: names.join('\n'), data: { devices: names } }
        }
        session.requireBidi('Device emulation')
        const name = findDevice(value)
        if (!name) {
            const close = Object.keys(deviceDescriptorsSource).filter((n) => n.toLowerCase().includes(value.toLowerCase().split(' ')[0])).slice(0, 8)
            throw usage(`Unknown device "${value}".`, close.length ? `Did you mean: ${close.join(', ')}?` : 'Run `wdio session emulate device` to list devices.')
        }
        const device = deviceDescriptorsSource[name]
        await swap(session, 'device', () => browser.emulate('device', name))
        return {
            ...done(`Emulating ${name} (${device.viewport.width}x${device.viewport.height} @${device.deviceScaleFactor}x). ${RELOAD_HINT}`, `await browser.emulate('device', ${quote(name)})`),
            data: { device: name, ...device.viewport, devicePixelRatio: device.deviceScaleFactor }
        }
    }
    case 'viewport': {
        const size = parseViewport(needsValue('a size like 1280x720'))
        const dpr = typeof args.dpr === 'number' ? args.dpr : undefined
        if (session.isBidi) {
            await browser.setViewport({ ...size, ...(dpr ? { devicePixelRatio: dpr } : {}) })
            return done(`Viewport ${size.width}x${size.height}${dpr ? ` @${dpr}x` : ''}`,
                `await browser.setViewport({ width: ${size.width}, height: ${size.height}${dpr ? `, devicePixelRatio: ${dpr}` : ''} })`)
        }
        if (dpr) {
            session.requireBidi('--dpr')
        }
        await browser.setWindowSize(size.width, size.height)
        return done(`Window size ${size.width}x${size.height}`, `await browser.setWindowSize(${size.width}, ${size.height})`)
    }
    case 'network': {
        const preset = needsValue('offline, online or a preset (GPRS, Regular3G, Good3G, Regular4G, DSL, WiFi)')
        if (preset === 'offline' || preset === 'online') {
            session.requireBidi('Network emulation')
            const offline = preset === 'offline'
            if (!offline && isChromium(session) && restores(session).has('throttle')) {
                await remember(session, 'throttle', undefined)
            }
            await swap(session, 'network', async () => {
                await browser.emulationSetNetworkConditions({ networkConditions: offline ? { type: 'offline' } : null })
                return offline ? () => browser.emulationSetNetworkConditions({ networkConditions: null }) : undefined
            })
            return done(offline ? 'Network offline' : 'Network online',
                `await browser.emulationSetNetworkConditions({ networkConditions: ${offline ? "{ type: 'offline' }" : 'null'} })`)
        }
        const conditions = Object.entries(NETWORK_PRESETS).find(([name]) => name.toLowerCase() === preset.toLowerCase())
        if (!conditions) {
            throw usage(`Unknown network preset "${preset}".`, `Use offline, online or one of ${Object.keys(NETWORK_PRESETS).join(', ')}.`)
        }
        if (!isChromium(session)) {
            throw notSupported('Network throttling is only supported in Chromium based browsers.')
        }
        const [name, values] = conditions
        await swap(session, 'throttle', async () => {
            await browser.setNetworkConditions(values)
            return () => browser.deleteNetworkConditions()
        })
        return done(`Network throttled to ${name} (${values.latency}ms latency)`,
            `await browser.setNetworkConditions({ latency: ${values.latency}, download_throughput: ${values.download_throughput}, upload_throughput: ${values.upload_throughput} })`)
    }
    case 'cpu': {
        const rate = Number(needsValue('a slowdown factor, e.g. 4'))
        if (!Number.isFinite(rate) || rate < 1) {
            throw usage('The CPU slowdown factor must be a number >= 1.')
        }
        if (!isChromium(session)) {
            throw notSupported('CPU throttling is only supported in Chromium based browsers.')
        }
        await swap(session, 'cpu', async () => {
            await browser.sendCommand('Emulation.setCPUThrottlingRate', { rate })
            return rate === 1 ? undefined : () => browser.sendCommand('Emulation.setCPUThrottlingRate', { rate: 1 })
        })
        return done(`CPU ${rate}x slower`, `await browser.sendCommand('Emulation.setCPUThrottlingRate', { rate: ${rate} })`)
    }
    case 'clock': {
        session.requireBidi('Clock emulation')
        const tick = typeof args.tick === 'number' ? args.tick : undefined
        let clock = session.get<Clock>('clock')
        const lines: string[] = []
        const code: string[] = []
        if (value || !clock) {
            const now = value ? new Date(value) : new Date()
            if (Number.isNaN(now.getTime())) {
                throw usage(`Invalid date "${value}".`, 'Use an ISO date like 2030-01-01T00:00:00Z.')
            }
            if (clock) {
                await clock.setSystemTime(now)
                code.push(`await clock.setSystemTime(new Date(${quote(now.toISOString())}))`)
            } else {
                clock = await browser.emulate('clock', { now }) as unknown as Clock
                session.set('clock', clock)
                await remember(session, 'clock', async () => {
                    session.set('clock', undefined)
                    await clock!.restore()
                })
                code.push(`const clock = await browser.emulate('clock', { now: new Date(${quote(now.toISOString())}) })`)
            }
            lines.push(`Clock set to ${now.toISOString()}`)
        }
        if (tick !== undefined) {
            await clock.tick(tick)
            code.push(`await clock.tick(${tick})`)
            lines.push(`Clock advanced by ${tick}ms`)
        }
        return done(lines.join('\n'), code.join('\n'))
    }
    case 'color-scheme': {
        const scheme = needsValue('light or dark')
        if (scheme !== 'light' && scheme !== 'dark') {
            throw usage(`Invalid color scheme "${scheme}".`, 'Use light or dark.')
        }
        session.requireBidi('Color scheme emulation')
        await swap(session, 'colorScheme', () => browser.emulate('colorScheme', scheme))
        return done(`Color scheme ${scheme}. ${RELOAD_HINT}`, `await browser.emulate('colorScheme', '${scheme}')`)
    }
    case 'user-agent': {
        const ua = needsValue('a user agent string')
        session.requireBidi('User agent emulation')
        await swap(session, 'userAgent', () => browser.emulate('userAgent', ua))
        return done(`User agent set. ${RELOAD_HINT}`, `await browser.emulate('userAgent', ${quote(ua)})`)
    }
    case 'reset': {
        const map = restores(session)
        const scopes = [...map.keys()]
        for (const scope of scopes) {
            await remember(session, scope, undefined)
        }
        await applyViewport(session).catch(() => {})
        return done(scopes.length ? `Reset ${scopes.join(', ')}. ${RELOAD_HINT}` : 'Nothing to reset', 'await browser.restore()')
    }
    default:
        throw usage(`Unknown emulation "${sub}".`)
    }
}

export const geolocation: ActionFn = async (session, args) => {
    const latitude = Number(args.lat)
    const longitude = Number(args.lon)
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        throw usage(`Invalid coordinates ${args.lat} ${args.lon}.`, 'Latitude must be within ±90 and longitude within ±180.')
    }
    const accuracy = typeof args.accuracy === 'number' ? args.accuracy : undefined
    const { browser } = session
    if (session.applies.includes('M')) {
        await browser.setGeoLocation({ latitude, longitude, altitude: 0 })
        return done(`Location set to ${latitude}, ${longitude}`, `await browser.setGeoLocation({ latitude: ${latitude}, longitude: ${longitude}, altitude: 0 })`)
    }
    session.requireBidi('Geolocation emulation')
    const coords = { latitude, longitude, ...(accuracy !== undefined ? { accuracy } : {}) }
    await swap(session, 'geolocation', () => browser.emulate('geolocation', coords))
    return done(`Location set to ${latitude}, ${longitude}. ${RELOAD_HINT}`,
        `await browser.emulate('geolocation', { latitude: ${latitude}, longitude: ${longitude}${accuracy !== undefined ? `, accuracy: ${accuracy}` : ''} })`)
}
