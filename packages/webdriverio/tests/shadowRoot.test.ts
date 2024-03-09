import { describe, it, vi, expect, beforeEach } from 'vitest'

import { getShadowRootManager } from '../src/shadowRoot.js'

const defaultBrowser = {
    sessionSubscribe: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    scriptAddPreloadScript: vi.fn(),
}

describe('ShadowRootManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should get shadow root manager per browser session', () => {
        const browserA = { ...defaultBrowser } as any
        const browserB = { ...defaultBrowser } as any
        const managerA = getShadowRootManager(browserA)
        const managerB = getShadowRootManager(browserB)
        const managerC = getShadowRootManager(browserA)
        expect(managerA).not.toBe(managerB)
        expect(managerA).toBe(managerC)
    })

    it('registers correct event listeners', async () => {
        const wid = process.env.VITEST_WORKER_ID
        delete process.env.VITEST_WORKER_ID
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        process.env.VITEST_WORKER_ID = wid
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(1)
        expect(browser.on).toBeCalledTimes(2)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(1)
    })

    it('should reset shadow roots on context load', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        expect(manager.getShadowRootsForContext('foobar')).toEqual([])
        const manager2 = getShadowRootManager({ ...defaultBrowser } as any)
        expect(manager2.getShadowRootsForContext()).toEqual([])
        manager2.deleteShadowRoot('foobar')
    })

    it('should capture shadow root elements', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobar' }
        } as any)
        expect(manager.getShadowRootsForContext('foobar')).toEqual(['foobar'])
        expect(manager.getElementWithShadowDOM('foobar')).toBe('barfoo')
    })

    it('should delete shadow root elements', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobar' }
        } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'removeShadowRoot' },
                { type: 'node', sharedId: 'foobar' }
            ],
            source: { context: 'foobar' }
        } as any)
        expect(manager.getShadowRootsForContext('foobar')).toEqual([])
        expect(manager.getElementWithShadowDOM('foobar')).toBe(undefined)
    })

    it('should ignore log entries that are not of interest', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: 'foobar' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobar' }
        } as any)
        expect(manager.getShadowRootsForContext('foobar')).toEqual([])
    })

    it('should throw if log entry is invalid', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        expect(() => manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'foobar' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobar' }
        } as any)).toThrow()
    })

    it('should handle log entries without args or context or with a different context', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleBrowsingContextLoad({ context: 'foobar' } as any)
        manager.handleLogEntry({
            level: 'debug',
            source: { context: 'foobar' }
        } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'foobar' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: {}
        } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'barfoo' }
        } as any)
        expect(manager.getShadowRootsForContext('foobar')).toEqual([])
    })
})
