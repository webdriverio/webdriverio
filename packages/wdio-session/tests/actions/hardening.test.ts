import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { emulate } from '../../src/actions/emulate.js'
import { record, trace } from '../../src/actions/evidence.js'
import { exportSpec } from '../../src/actions/export.js'
import { mock } from '../../src/actions/network.js'
import { state } from '../../src/actions/state.js'
import { visual } from '../../src/actions/visual.js'
import { History } from '../../src/history.js'
import type { Session } from '../../src/session.js'

const dirs: string[] = []

function tempDir () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-hardening-'))
    dirs.push(dir)
    return dir
}

function mem () {
    const store = new Map<string, unknown>()
    return {
        store,
        get: <T>(key: string) => store.get(key) as T | undefined,
        set: (key: string, value: unknown) => store.set(key, value)
    }
}

afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('mock replacement', () => {
    it('restores the previous intercept before creating the next one', async () => {
        const order: string[] = []
        const bag = mem()
        const session = {
            ...bag,
            isBidi: true,
            cwd: '/',
            requireBidi () {},
            browser: {
                mock: async (pattern: string) => {
                    order.push(`create ${pattern}`)
                    return {
                        restore: async () => {
                            order.push(`restore ${pattern}`)
                        },
                        respond () {}
                    }
                }
            }
        } as unknown as Session
        await mock(session, { pattern: '**/api', body: '{"a":1}' })
        await mock(session, { pattern: '**/api', method: 'POST', body: '{"b":1}' })
        expect(order).toEqual(['create **/api', 'restore **/api', 'create **/api'])
    })
})

describe('emulation replacement', () => {
    it('restores the previous device before applying the next one', async () => {
        const order: string[] = []
        const bag = mem()
        const session = {
            ...bag,
            isBidi: true,
            requireBidi () {},
            browser: {
                capabilities: { browserName: 'chrome' },
                emulate: async (_kind: string, name: string) => {
                    order.push(`apply ${name}`)
                    return async () => {
                        order.push(`restore ${name}`)
                    }
                }
            }
        } as unknown as Session
        await emulate(session, { sub: 'device', value: 'iPhone 15' })
        await emulate(session, { sub: 'device', value: 'iPhone 14' })
        expect(order).toEqual(['apply iPhone 15', 'restore iPhone 15', 'apply iPhone 14'])
    })
})

describe('saved state', () => {
    it('writes the file as owner-only and clears storage before restoring it', async () => {
        const dir = tempDir()
        const file = path.join(dir, 'state.json')
        const calls: string[] = []
        const local = new Map<string, string>([['stale', '1']])
        const sessionStore = new Map<string, string>([['stale', '1']])
        const storage = (map: Map<string, string>) => ({
            get length () {
                return map.size
            },
            key: (index: number) => [...map.keys()][index] ?? null,
            getItem: (key: string) => map.get(key) ?? null,
            setItem: (key: string, value: string) => map.set(key, value),
            clear: () => map.clear()
        })
        const browser = {
            getUrl: async () => 'https://example.com/home',
            getCookies: async () => [{ name: 'sid', value: 'secret' }],
            deleteCookies: async () => {
                calls.push('deleteCookies')
            },
            setCookies: async () => {
                calls.push('setCookies')
            },
            url: async () => {},
            refresh: async () => {},
            execute: async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => {
                if (args.length === 2) {
                    calls.push('execute')
                    vm.runInNewContext(`(${fn})(localArg, sessionArg)`, {
                        localArg: args[0],
                        sessionArg: args[1],
                        localStorage: storage(local),
                        sessionStorage: storage(sessionStore)
                    })
                }
                return {}
            }
        }
        const session = {
            ...mem(),
            cwd: dir,
            browser,
            currentUrl: async () => 'https://example.com/home'
        } as unknown as Session
        await state(session, { sub: 'save', file, $cwd: dir })
        if (process.platform !== 'win32') {
            expect(fs.statSync(file).mode & 0o777).toBe(0o600)
        }
        local.set('keep', 'no')
        await state(session, { sub: 'load', file, $cwd: dir })
        expect(calls).toEqual(['deleteCookies', 'setCookies', 'execute'])
        expect(local.has('stale')).toBe(false)
        expect(local.get('keep')).toBeUndefined()
        expect([...local.keys()]).toEqual([])
    })
})

describe('history file', () => {
    it('creates history.json as owner-only', () => {
        const dir = tempDir()
        const history = new History(dir)
        history.append({ kind: 'action', code: 'await browser.url("/")' })
        if (process.platform !== 'win32') {
            expect(fs.statSync(history.file).mode & 0o777).toBe(0o600)
        }
    })
})

describe('export overwrite', () => {
    it('refuses to replace an existing page object', async () => {
        const dir = tempDir()
        const page = path.join(dir, 'pageobjects', 'Home.page.ts')
        fs.mkdirSync(path.dirname(page), { recursive: true })
        fs.writeFileSync(page, 'export default class HomePage {}\n')
        const session = {
            name: 'home',
            cwd: dir,
            plan: { remote: {} },
            history: {
                entries: [{
                    n: 1,
                    time: '2026-01-01T00:00:00.000Z',
                    kind: 'action',
                    code: "await $('h1').click()",
                    path: '/'
                }]
            },
            artifact: () => path.join(dir, 'out.e2e.ts')
        } as unknown as Session
        await expect(exportSpec(session, { pageObjects: true, out: 'out.e2e.ts', $cwd: dir })).rejects.toThrow(/already exists/)
        expect(fs.readFileSync(page, 'utf-8')).toBe('export default class HomePage {}\n')
    })
})

describe('visual accept', () => {
    it('copies only the latest check image for the tag', async () => {
        const dir = tempDir()
        const actual = path.join(dir, 'screenshots', 'actual')
        const baseline = path.join(dir, 'baseline')
        fs.mkdirSync(actual, { recursive: true })
        fs.writeFileSync(path.join(actual, 'home-old.png'), 'old')
        fs.writeFileSync(path.join(actual, 'home-new.png'), 'new')
        const bag = mem()
        bag.set('visualReady', true)
        bag.set('visualFolders', { screenshots: path.join(dir, 'screenshots'), baseline })
        bag.set('visualRecords', [{ tag: 'home', fileName: 'home-new.png' }])
        const session = { ...bag, cwd: dir, browser: {} } as unknown as Session
        await visual(session, { sub: 'accept', tag: 'home' })
        expect(fs.readFileSync(path.join(baseline, 'home-new.png'), 'utf-8')).toBe('new')
        expect(fs.existsSync(path.join(baseline, 'home-old.png'))).toBe(false)
    })
})

describe('recordings and traces', () => {
    it('records a mobile screen through Appium and keeps the file private', async () => {
        const dir = tempDir()
        const bag = mem()
        const session = {
            ...bag,
            cwd: dir,
            applies: ['M'],
            isBidi: false,
            plan: { target: 'android' },
            timestamp: () => 't',
            artifact: () => path.join(dir, 'record'),
            browser: {
                capabilities: { platformName: 'Android' },
                executeScript: async (script: string, args: unknown[]) => {
                    bag.set('script', script)
                    bag.set('args', args)
                },
                saveRecordingScreen: async (filepath: string) => {
                    fs.writeFileSync(filepath, 'video')
                    return Buffer.from('video')
                }
            }
        } as unknown as Session
        await record(session, { sub: 'start', fps: 8 })
        expect(bag.get('script')).toBe('mobile: startMediaProjectionRecording')
        const stopped = await record(session, { sub: 'stop' })
        const file = (stopped.data as { file: string }).file
        expect(fs.readFileSync(file).toString()).toBe('video')
        if (process.platform !== 'win32') {
            expect(fs.statSync(file).mode & 0o777).toBe(0o600)
            expect(fs.statSync(path.dirname(file)).mode & 0o777).toBe(0o700)
        }
    })

    it('captures fallback frames on a wall-clock interval', async () => {
        const dir = tempDir()
        const bag = mem()
        const intervals: number[] = []
        const real = global.setInterval
        vi.spyOn(global, 'setInterval').mockImplementation(((fn: TimerHandler, ms?: number) => {
            if (typeof ms === 'number') {
                intervals.push(ms)
            }
            return real(fn as () => void, 60_000)
        }) as typeof setInterval)
        const session = {
            ...bag,
            cwd: dir,
            applies: ['W'],
            isBidi: false,
            timestamp: () => 't',
            artifact: () => path.join(dir, 'record'),
            browser: {
                takeScreenshot: async () => Buffer.from('png').toString('base64')
            }
        } as unknown as Session
        await record(session, { sub: 'start', fps: 2 })
        const recorder = bag.get<{ timer?: NodeJS.Timeout }>('recorder')
        if (recorder?.timer) {
            clearInterval(recorder.timer)
        }
        expect(intervals).toContain(500)
    })

    it('restricts a trace directory and the trace file', async () => {
        const dir = tempDir()
        const bag = mem()
        const session = {
            ...bag,
            cwd: dir,
            timestamp: () => 't',
            artifact: () => path.join(dir, 'trace')
        } as unknown as Session
        await trace(session, { sub: 'start' })
        const traceDir = path.join(dir, 'trace')
        if (process.platform !== 'win32') {
            expect(fs.statSync(traceDir).mode & 0o777).toBe(0o700)
            expect(fs.statSync(path.join(traceDir, 'trace.trace')).mode & 0o777).toBe(0o600)
        }
    })
})
