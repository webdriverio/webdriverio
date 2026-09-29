import { deviceDescriptorsSource, type DeviceName } from 'webdriverio'

import { notSupported, usage } from '../errors.js'
import { applyViewport } from '../daemon/init.js'
import { quote } from '../quote.js'
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

interface Emulation {
    restore: Restore
    /** runs the command again when a later replacement fails */
    apply?: () => Promise<unknown>
}

function emulations (session: Session) {
    let map = session.get<Map<string, Emulation>>('emulation')
    if (!map) {
        map = new Map()
        session.set('emulation', map)
    }
    return map
}

/**
 * Undo an emulation and forget it.
 */
async function remember (session: Session, scope: string, restore: Restore | undefined) {
    const map = emulations(session)
    const previous = map.get(scope)
    map.delete(scope)
    await previous?.restore().catch(() => {})
    if (restore) {
        map.set(scope, { restore })
    }
}

/**
 * Replace one emulation. The previous restore runs first so it cannot undo
 * the new setting. If the new command fails, the previous one is put back.
 */
async function swap (session: Session, scope: string, apply: () => Promise<unknown>) {
    const map = emulations(session)
    const previous = map.get(scope)
    if (previous) {
        map.delete(scope)
        await previous.restore().catch(() => {})
    }
    try {
        const restore = await apply()
        if (typeof restore === 'function') {
            map.set(scope, { restore: restore as Restore, apply })
        }
    } catch (err) {
        if (previous?.apply) {
            try {
                const restore = await previous.apply()
                if (typeof restore === 'function') {
                    map.set(scope, { restore: restore as Restore, apply: previous.apply })
                }
            } catch {
                // the previous setting could not be put back
            }
        }
        throw err
    }
}

function isChromium (session: Session) {
    const name = String((session.browser.capabilities as WebdriverIO.Capabilities).browserName || '').toLowerCase()
    return ['chrome', 'chromium', 'msedge', 'microsoftedge', 'edge', 'electron'].some((n) => name.includes(n))
}

/**
 * Electron stays on the classic protocol, so BiDi `emulate` is unavailable.
 * Chromedriver still accepts these CDP commands, and the page script keeps a
 * widget that polls `Date` and `navigator.geolocation` in sync without
 * freezing `setInterval` the way fake timers do.
 */
/**
 * Raw page script. `browser.execute` runs it as-is, and
 * `Page.addScriptToEvaluateOnNewDocument` runs the same text in the next
 * document so a reload does not fall back to the real clock.
 */
export function clockInstallSource (fixed: number) {
    return `(() => {
        const now = ${fixed};
        const host = window;
        if (!host.__wdioNativeDate) {
            host.__wdioNativeDate = Date;
        }
        const Native = host.__wdioNativeDate;
        window.Date = new Proxy(Native, {
            construct (target, args, newTarget) {
                return Reflect.construct(target, args.length === 0 ? [now] : args, newTarget);
            },
            apply (target, thisArg, args) {
                return args.length === 0 ? new Native(now).toString() : Reflect.apply(target, thisArg, args);
            },
            get (target, prop, receiver) {
                if (prop === 'now') {
                    return () => now;
                }
                const value = Reflect.get(target, prop, receiver);
                return typeof value === 'function' ? value.bind(target) : value;
            }
        });
    })()`
}

const CLOCK_RESTORE_SOURCE = `(() => {
    const host = window;
    if (host.__wdioNativeDate) {
        window.Date = host.__wdioNativeDate;
    }
})()`

function executeSource (source: string) {
    return `await browser.execute(${JSON.stringify(source)})`
}

function preloadSource (source: string) {
    return `await browser.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: ${JSON.stringify(source)} })`
}

type PermissionSetting = 'granted' | 'denied' | 'prompt'

/**
 * Read the origin's geolocation permission before this command grants it.
 * Reset puts that value back. Guessing `prompt`, or resetting every origin,
 * would change a permission the test had already set.
 */
async function readGeolocationPermission (browser: WebdriverIO.Browser): Promise<PermissionSetting | undefined> {
    const state = await browser.execute(() => {
        const query = navigator.permissions?.query?.bind(navigator.permissions)
        if (!query) {
            return Promise.resolve('')
        }
        return query({ name: 'geolocation' }).then((status) => status.state).catch(() => '')
    }).catch(() => '')
    if (state === 'granted' || state === 'denied' || state === 'prompt') {
        return state
    }
    return undefined
}

async function preload (browser: WebdriverIO.Browser, source: string) {
    /**
     * `sendCommand` does not return the DevTools result, so the script id was
     * always missing and `emulate reset` could not remove the preload. A reload
     * then installed the clock again.
     */
    const cdp = browser as WebdriverIO.Browser & {
        sendCommandAndGetResult?: (command: string, params?: object) => Promise<{ identifier?: string } | undefined>
    }
    const added = cdp.sendCommandAndGetResult
        ? await cdp.sendCommandAndGetResult('Page.addScriptToEvaluateOnNewDocument', { source }).catch(() => undefined)
        : await browser.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source }).catch(() => undefined) as { identifier?: string } | undefined
    return typeof added?.identifier === 'string' ? added.identifier : undefined
}

async function writeGeolocationPermission (browser: WebdriverIO.Browser, origin: string, setting: PermissionSetting) {
    try {
        await browser.sendCommand('Browser.setPermission', {
            permission: { name: 'geolocation' },
            setting,
            origin
        })
        return true
    } catch {
        return false
    }
}

async function dropPreload (browser: WebdriverIO.Browser, identifier: string | undefined) {
    if (!identifier) {
        return
    }
    await browser.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier }).catch(() => {})
}

function geolocationSource (latitude: number, longitude: number, accuracy: number) {
    return `(() => {
        const coords = { latitude: ${latitude}, longitude: ${longitude}, accuracy: ${accuracy}, altitude: null, altitudeAccuracy: null, heading: null, speed: null }
        const position = () => ({ coords, timestamp: Date.now() })
        const geo = {
            getCurrentPosition (success) { success(position()) },
            watchPosition (success) { success(position()); return 1 },
            clearWatch () {}
        }
        try {
            Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geo })
        } catch (err) {}
        /**
         * \`Browser.setPermission\` can fail. Apps that ask \`permissions.query\`
         * before calling \`getCurrentPosition\` would otherwise keep the old state
         * and ignore the coordinates this command just installed.
         */
        const permissions = navigator.permissions
        const current = permissions && permissions.query
        if (current && !current.__wdioGeolocationQuery) {
            const own = Object.getOwnPropertyDescriptor(permissions, 'query')
            const wrapped = function (descriptor) {
                if (descriptor && descriptor.name === 'geolocation') {
                    const target = new EventTarget()
                    let handler = null
                    Object.defineProperties(target, {
                        state: { enumerable: true, value: 'granted' },
                        name: { enumerable: true, value: 'geolocation' },
                        onchange: {
                            enumerable: true,
                            get () { return handler },
                            set (fn) {
                                if (handler) target.removeEventListener('change', handler)
                                handler = typeof fn === 'function' ? fn : null
                                if (handler) target.addEventListener('change', handler)
                            }
                        }
                    })
                    return Promise.resolve(target)
                }
                return current.call(permissions, descriptor)
            }
            wrapped.__wdioGeolocationQuery = true
            wrapped.__wdioGeolocationOwn = Boolean(own)
            if (own) wrapped.__wdioOriginalQuery = current
            try {
                permissions.query = wrapped
            } catch (err) {
                try {
                    Object.defineProperty(permissions, 'query', { configurable: true, writable: true, value: wrapped })
                } catch (err2) {}
            }
        }
    })()`
}

const GEOLOCATION_RESTORE_SOURCE = `(() => {
    const desc = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    if (desc && desc.configurable) {
        delete navigator.geolocation;
    }
    const permissions = navigator.permissions;
    const wrapped = permissions && permissions.query;
    if (wrapped && wrapped.__wdioGeolocationQuery) {
        try {
            if (wrapped.__wdioGeolocationOwn && wrapped.__wdioOriginalQuery) {
                permissions.query = wrapped.__wdioOriginalQuery;
            } else {
                delete permissions.query;
            }
        } catch (err) {}
    }
})()`

async function installClassicGeolocation (browser: WebdriverIO.Browser, latitude: number, longitude: number, accuracy: number): Promise<Restore> {
    const source = geolocationSource(latitude, longitude, accuracy)
    await browser.sendCommand('Emulation.setGeolocationOverride', { latitude, longitude, accuracy }).catch(() => {})
    const url = await browser.getUrl().catch(() => '')
    let origin = ''
    try {
        origin = new URL(url).origin
    } catch {
        origin = ''
    }
    const previous = origin ? await readGeolocationPermission(browser) : undefined
    if (origin) {
        /**
         * `setPermission` changes only geolocation. If it fails, the page script
         * still reports the permission as granted. `grantPermissions` would deny
         * every other permission, and `resetPermissions` would clear every origin.
         */
        await writeGeolocationPermission(browser, origin, 'granted')
    }
    const identifier = await preload(browser, source)
    await browser.execute(source)
    return async () => {
        await dropPreload(browser, identifier)
        await browser.sendCommand('Emulation.clearGeolocationOverride', {}).catch(() => {})
        if (origin) {
            /**
             * An unreadable previous state still has to drop the grant. `prompt`
             * is that origin only. A failed write is left as-is: `resetPermissions`
             * has no origin and would clear overrides for every other origin.
             */
            await writeGeolocationPermission(browser, origin, previous ?? 'prompt')
        }
        await browser.execute(GEOLOCATION_RESTORE_SOURCE)
    }
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
            if (!offline && isChromium(session) && emulations(session).has('throttle')) {
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
        const tick = typeof args.tick === 'number' ? args.tick : undefined
        /**
         * BiDi installs Sinon fake timers. That bundle calls `require` in
         * some Chromium builds, and fake timers also freeze `setInterval`,
         * so a widget that polls the clock never repaints. A Date patch
         * leaves timers running. Chromium uses it for an absolute time and
         * for `--tick`, which moves that same patched `Date`.
         */
        const classicClock = async () => {
            if (!isChromium(session)) {
                session.requireBidi('Clock emulation')
            }
            const previousNow = session.get<number>('classic-clock-now')
            let nowMs: number
            if (tick !== undefined && !value && previousNow !== undefined) {
                nowMs = previousNow + tick
            } else {
                const now = value ? new Date(value) : new Date()
                if (Number.isNaN(now.getTime())) {
                    throw usage(`Invalid date "${value}".`, 'Use an ISO date like 2030-01-01T00:00:00Z.')
                }
                nowMs = now.getTime() + (tick ?? 0)
            }
            const source = clockInstallSource(nowMs)
            // swap restores the previous clock before this one is installed.
            // Restoring afterwards would put Date back and undo the new time.
            await swap(session, 'clock', async () => {
                const identifier = await preload(browser, source)
                await browser.execute(source)
                session.set('classic-clock-now', nowMs)
                return async () => {
                    session.set('classic-clock-now', undefined)
                    await dropPreload(browser, identifier)
                    await browser.execute(CLOCK_RESTORE_SOURCE)
                }
            })
            const shown = executeSource(source)
            const advancedOnly = tick !== undefined && !value && previousNow !== undefined
            return {
                text: advancedOnly ? `Clock advanced by ${tick}ms` : `Clock set to ${new Date(nowMs).toISOString()}`,
                code: shown,
                // The page script alone is gone after a reload. The exported
                // step also installs it for the next document.
                history: [preloadSource(source), shown].join('\n')
            }
        }
        // Chromium's BiDi clock installs fake timers. That bundle calls
        // `require` in current Chrome, and the init script it leaves behind
        // freezes `setInterval`, so a widget that polls `Date` never repaints.
        // An absolute time uses a Date patch instead. `--tick` still needs BiDi.
        if (isChromium(session)) {
            return classicClock()
        }
        if (!session.isBidi) {
            return classicClock()
        }
        try {
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
        } catch (err) {
            if (!isChromium(session) || tick !== undefined) {
                throw err
            }
            return classicClock()
        }
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
        const map = emulations(session)
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
    if (!session.isBidi) {
        if (!isChromium(session)) {
            session.requireBidi('Geolocation emulation')
        }
        const accuracyMeters = accuracy ?? 1
        const source = geolocationSource(latitude, longitude, accuracyMeters)
        await swap(session, 'geolocation', () => installClassicGeolocation(browser, latitude, longitude, accuracyMeters))
        const shown = `await browser.sendCommand('Emulation.setGeolocationOverride', { latitude: ${latitude}, longitude: ${longitude}, accuracy: ${accuracyMeters} })`
        return {
            text: `Location set to ${latitude}, ${longitude}`,
            code: shown,
            // The override alone does not survive a reload. The exported step
            // also installs the page script for this document and the next one.
            history: [
                shown,
                preloadSource(source),
                executeSource(source)
            ].join('\n')
        }
    }
    session.requireBidi('Geolocation emulation')
    const coords = { latitude, longitude, ...(accuracy !== undefined ? { accuracy } : {}) }
    await swap(session, 'geolocation', () => browser.emulate('geolocation', coords))
    return done(`Location set to ${latitude}, ${longitude}. ${RELOAD_HINT}`,
        `await browser.emulate('geolocation', { latitude: ${latitude}, longitude: ${longitude}${accuracy !== undefined ? `, accuracy: ${accuracy}` : ''} })`)
}
