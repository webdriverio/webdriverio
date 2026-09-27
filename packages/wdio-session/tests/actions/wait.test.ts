import { afterEach, describe, expect, it, vi } from 'vitest'

import { matchUrl, wait } from '../../src/actions/wait.js'
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

describe('wait', () => {
    it('waits until text and a URL appear', async () => {
        const browser = {
            $: (selector: string) => ({ getText: async () => (selector === 'body' ? 'Welcome back' : '') }),
            getUrl: async () => 'https://example.com/app/dashboard',
            waitUntil: async (cond: () => Promise<boolean>) => {
                expect(await cond()).toBe(true)
            }
        }
        const session = { browser } as unknown as Session
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
        expect((await wait(session, { load: 'domcontentloaded', $cwd: '/' })).text).toBe('Page reached domcontentloaded')
    })

    it('waits until resource counts stay quiet', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        const browser = {
            execute: async (script: unknown) => (String(script).includes('readyState') ? 'complete' : 4),
            waitUntil: async (cond: () => Promise<boolean>) => {
                expect(await cond()).toBe(false)
                vi.setSystemTime(Date.now() + 500)
                expect(await cond()).toBe(true)
            }
        }
        const result = await wait({ browser } as unknown as Session, { load: 'networkidle', $cwd: '/' })
        expect(result.text).toBe('Page is network-idle')
    })

    it('waits for an element to be hidden', async () => {
        let reverse = false
        const browser = {
            $: () => ({
                waitForDisplayed: async (opts: { reverse?: boolean }) => {
                    reverse = Boolean(opts.reverse)
                }
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
