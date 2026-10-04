import { afterEach, describe, expect, it, vi } from 'vitest'

import { SessionError } from '../../src/errors.js'
import { matchUrl, pageNetworkState, wait } from '../../src/actions/wait.js'
import type { Session } from '../../src/session.js'

afterEach(() => {
    vi.useRealTimers()
})

describe('matchUrl', () => {
    it('matches a substring or a ** glob against the whole URL', () => {
        expect(matchUrl('dashboard', 'https://example.com/app/dashboard')).toBe(true)
        expect(matchUrl('**/dashboard', 'https://example.com/app/dashboard')).toBe(true)
        expect(matchUrl('**/dashboard', 'https://example.com/dashboard/settings')).toBe(false)
        expect(matchUrl('https://example.com/*', 'https://example.com/cart')).toBe(true)
        expect(matchUrl('https://example.com/*', 'https://example.com/cart/1')).toBe(false)
    })
})

describe('pageNetworkState', () => {
    const saved = {
        window: globalThis.window,
        document: globalThis.document,
        performance: globalThis.performance,
        XMLHttpRequest: globalThis.XMLHttpRequest
    }

    afterEach(() => {
        globalThis.window = saved.window
        globalThis.document = saved.document
        globalThis.performance = saved.performance
        globalThis.XMLHttpRequest = saved.XMLHttpRequest
    })

    function installPage () {
        class XHR {
            listeners = new Map<string, Array<() => void>>()
            addEventListener (type: string, fn: () => void) {
                const list = this.listeners.get(type) || []
                list.push(fn)
                this.listeners.set(type, list)
            }
            send () {
                throw new Error('InvalidStateError')
            }
        }
        const resources: Array<{ responseEnd: number, duration: number }> = []
        const window = { fetch: () => Promise.resolve() } as unknown as Window & typeof globalThis
        globalThis.window = window
        globalThis.document = { readyState: 'complete' } as Document
        globalThis.performance = { getEntriesByType: () => resources } as unknown as Performance
        globalThis.XMLHttpRequest = XHR as unknown as typeof XMLHttpRequest
        return { XHR, resources }
    }

    it('does not keep a failed XMLHttpRequest.send in flight', () => {
        const { XHR } = installPage()
        pageNetworkState()
        const xhr = new XHR()
        expect(() => xhr.send()).toThrow('InvalidStateError')
        expect(pageNetworkState().inflight).toBe(0)
    })

    it('does not treat a finished cross-origin resource as in flight', () => {
        const { resources } = installPage()
        resources.push(
            { responseEnd: 0, duration: 12 },
            { responseEnd: 0, duration: 0 },
            { responseEnd: 40, duration: 40 }
        )
        expect(pageNetworkState().inflight).toBe(1)
    })
})

describe('wait', () => {
    it('waits until text and a URL appear', async () => {
        const browser = {
            $: (selector: string) => ({ getText: async () => (selector === 'body' ? 'Welcome back' : '') }),
            getUrl: async () => 'https://example.com/app/dashboard',
            waitUntil: async (cond: () => Promise<boolean>) => {
                expect(await cond()).toBe(true)
            }
        }
        const session = { browser, currentUrl: () => browser.getUrl() } as unknown as Session
        expect((await wait(session, { text: 'Welcome', $cwd: '/' })).text).toBe('Text appeared: Welcome')
        expect((await wait(session, { url: '**/dashboard', $cwd: '/' })).text).toBe('URL matches **/dashboard')
    })

    it('waits for a JavaScript condition and a load state', async () => {
        const browser = {
            execute: async (script: unknown) => {
                const source = String(script)
                if (source.includes('readyState')) {
                    return 'interactive'
                }
                return source.includes('appReady')
            },
            waitUntil: async (cond: () => Promise<boolean>) => {
                expect(await cond()).toBe(true)
            }
        }
        const session = { browser } as unknown as Session
        expect((await wait(session, { fn: 'window.appReady === true', $cwd: '/' })).text).toContain('appReady')
        const loaded = await wait(session, { load: 'domcontentloaded', $cwd: '/' })
        expect(loaded.text).toBe('Page reached domcontentloaded')
        expect(loaded.code).toContain('browser.execute(() => document.readyState')
    })

    it('stays busy while a request is in flight even if the completed count does not change', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        let inflight = 1
        const browser = {
            execute: async () => ({ ready: 'complete', completed: 4, inflight }),
            waitUntil: async (cond: () => Promise<boolean>) => {
                expect(await cond()).toBe(false)
                vi.setSystemTime(Date.now() + 500)
                expect(await cond()).toBe(false)
                inflight = 0
                expect(await cond()).toBe(false)
                vi.setSystemTime(Date.now() + 500)
                expect(await cond()).toBe(true)
            }
        }
        const result = await wait({ browser, get: () => undefined } as unknown as Session, { load: 'networkidle', $cwd: '/' })
        expect(result.text).toBe('Page is network-idle')
        expect(result.code).toContain('browser.execute')
        expect(result.code).toContain('inflight')
    })

    it('treats a stale ref as already hidden', async () => {
        const session = {
            browser: {},
            refs: {
                resolve: async () => {
                    throw new SessionError('REF_STALE', 'e1 no longer exists on the page.')
                }
            }
        } as unknown as Session
        const result = await wait(session, { target: '@e1', state: 'hidden', $cwd: '/' })
        expect(result.text).toContain('e1 is hidden')
    })

    it('waits for an element to be hidden', async () => {
        let reverse = false
        const browser = {
            $: () => ({
                getElement: async () => ({
                    waitForDisplayed: async (opts: { reverse?: boolean }) => {
                        reverse = Boolean(opts.reverse)
                    }
                })
            })
        }
        const result = await wait({ browser } as unknown as Session, { target: '#spinner', state: 'hidden', $cwd: '/' })
        expect(reverse).toBe(true)
        expect(result.text).toContain('hidden')
    })

    it('pauses for a short number of milliseconds and refuses a long sleep', async () => {
        vi.useFakeTimers()
        const pending = wait({ browser: {} } as unknown as Session, { target: '40', $cwd: '/' })
        await vi.advanceTimersByTimeAsync(40)
        expect((await pending).text).toBe('Waited 40ms')
        await expect(wait({ browser: {} } as unknown as Session, { target: '60000', $cwd: '/' })).rejects.toThrow('Refusing to sleep')
    })

    it('requires exactly one thing to wait for', async () => {
        await expect(wait({ browser: {} } as unknown as Session, { text: 'Hi', url: '/x', $cwd: '/' })).rejects.toThrow('Say what to wait for.')
    })
})
