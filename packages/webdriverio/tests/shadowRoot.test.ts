import { describe, it, vi, expect, beforeEach } from 'vitest'
import logger from '@wdio/logger'

import { getShadowRootManager, ShadowRootTree } from '../src/session/shadowRoot.js'

const defaultBrowser = {
    sessionId: '123',
    sessionSubscribe: vi.fn().mockResolvedValue({}),
    on: vi.fn(),
    scriptAddPreloadScript: vi.fn(),
    capabilities: {}
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
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const browser = { ...defaultBrowser, isBidi: true, options: { capabilities: { webSocketUrl: './' } } } as any
        browser.sessionId = '234'
        const manager = getShadowRootManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(1)
        expect(browser.on).toBeCalledTimes(4)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(1)
    })

    it('should not register event listeners if not in bidi mode', async () => {
        const browser = { ...defaultBrowser } as any
        browser.sessionId = '345'
        const manager = getShadowRootManager(browser)
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(0)
        expect(browser.on).toBeCalledTimes(1)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(0)
    })

    it('should not register event listeners if not using webdriver as automation protocol', async () => {
        const browser = { ...defaultBrowser, isBidi: true, automationProtocol: './protocol-stub.js' } as any
        browser.sessionId = '456'
        const manager = getShadowRootManager(browser)
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(0)
        expect(browser.on).toBeCalledTimes(1)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(0)
    })

    it('should capture shadow root elements', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar', value: {
                    shadowRoot: {
                        sharedId: 'shadowFoobar',
                        value: {
                            nodeType: 11,
                            mode: 'closed'
                        }
                    }
                } },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobarContext' }
        } as any)
        expect(await manager.getShadowElementsByContextId('foobarContext')).toEqual(['barfoo', 'shadowFoobar'])
        expect(manager.getShadowRootModeById('foobarContext', 'foobar')).toBe('closed')
        expect(await manager.getShadowElementPairsByContextId('foobarContext')).toEqual([
            ['barfoo', undefined],
            ['foobar', 'shadowFoobar']
        ])
    })

    it('should ignore log entries that are not of interest', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: 'foobar' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'foobar' },
                { type: 'node', sharedId: 'barfoo' }
            ],
            source: { context: 'foobarContext' }
        } as any)
        expect(await manager.getShadowElementsByContextId('foobarContext')).toEqual([])
    })

    it('should throw if log entry is invalid', () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
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

    it('should handle removeShadowRoot without sharedId gracefully', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        // First register a shadow root
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'elem1', value: {
                    shadowRoot: {
                        sharedId: 'shadow1',
                        value: { nodeType: 11, mode: 'open' }
                    },
                    localName: 'my-component'
                } },
                { type: 'node', sharedId: 'root1' },
                { type: 'boolean', value: true },
                { type: 'node', sharedId: 'docElem' }
            ],
            source: { context: 'spaContext' }
        } as any)
        expect(await manager.getShadowElementsByContextId('spaContext')).toContain('shadow1')

        // removeShadowRoot without sharedId (element GC'd in SPA navigation)
        // should NOT throw
        expect(() => manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'removeShadowRoot' },
                { type: 'node' } // no sharedId ? element was garbage collected
            ],
            source: { context: 'spaContext' }
        } as any)).not.toThrow()
    })

    it('should remove shadow root when removeShadowRoot has valid sharedId', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        // Register a shadow root
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'elemA', value: {
                    shadowRoot: {
                        sharedId: 'shadowA',
                        value: { nodeType: 11, mode: 'open' }
                    },
                    localName: 'test-element'
                } },
                { type: 'node', sharedId: 'rootA' },
                { type: 'boolean', value: true },
                { type: 'node', sharedId: 'docElemA' }
            ],
            source: { context: 'removeContext' }
        } as any)
        expect(await manager.getShadowElementsByContextId('removeContext')).toContain('shadowA')

        // removeShadowRoot with valid sharedId
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'removeShadowRoot' },
                { type: 'node', sharedId: 'elemA' }
            ],
            source: { context: 'removeContext' }
        } as any)
        expect(await manager.getShadowElementsByContextId('removeContext')).not.toContain('shadowA')
    })

    it('should purge old shadow roots when document ID changes', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        const handleLogEntry = manager.handleLogEntry.bind(manager)

        // Register shadow root with document A
        handleLogEntry({
            level: 'debug',
            source: { context: 'ctx1' },
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.100', value: { localName: 'comp-a', shadowRoot: { sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.101', value: { nodeType: 11, mode: 'open' } } } },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.1' },
                { type: 'boolean', value: true },
                { type: 'node', sharedId: 'root1' }
            ]
        } as any)

        let elements = await manager.getShadowElementsByContextId('ctx1')
        expect(elements.length).toBeGreaterThan(0)

        // Register shadow root with NEW document B → should purge old entries
        handleLogEntry({
            level: 'debug',
            source: { context: 'ctx1' },
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'f.C1.d.BBBB0000BBBB0000BBBB0000BBBB0000.e.200', value: { localName: 'comp-b', shadowRoot: { sharedId: 'f.C1.d.BBBB0000BBBB0000BBBB0000BBBB0000.e.201', value: { nodeType: 11, mode: 'open' } } } },
                { type: 'node', sharedId: 'f.C1.d.BBBB0000BBBB0000BBBB0000BBBB0000.e.2' },
                { type: 'boolean', value: true },
                { type: 'node', sharedId: 'root2' }
            ]
        } as any)

        elements = await manager.getShadowElementsByContextId('ctx1')
        // Should only contain elements from document B, not document A
        const hasDocA = elements.some(e => e.includes('AAAA0000'))
        const hasDocB = elements.some(e => e.includes('BBBB0000'))
        expect(hasDocA).toBe(false)
        expect(hasDocB).toBe(true)
    })

    it('should not purge when document ID stays the same', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        const handleLogEntry = manager.handleLogEntry.bind(manager)

        // Register two shadow roots with same document
        handleLogEntry({
            level: 'debug',
            source: { context: 'ctx1' },
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.100', value: { localName: 'comp-a', shadowRoot: { sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.101', value: { nodeType: 11, mode: 'open' } } } },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.1' },
                { type: 'boolean', value: true },
                { type: 'node', sharedId: 'root1' }
            ]
        } as any)

        handleLogEntry({
            level: 'debug',
            source: { context: 'ctx1' },
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.200', value: { localName: 'comp-b', shadowRoot: { sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.201', value: { nodeType: 11, mode: 'open' } } } },
                { type: 'node', sharedId: 'f.C1.d.AAAA0000AAAA0000AAAA0000AAAA0000.e.1' },
                { type: 'boolean', value: false },
                { type: 'node', sharedId: 'root1' }
            ]
        } as any)

        const elements = await manager.getShadowElementsByContextId('ctx1')
        // Should have both elements since same document
        expect(elements.filter(e => e.includes('AAAA0000')).length).toBeGreaterThanOrEqual(2)
    })

    it('should return [] when scope is unrelated to any shadow tree (regression test for the original bug)', async () => {
        // batched containment check: report every candidate host as NOT contained
        const executeMock = vi.fn().mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
            Promise.resolve(elements.map(() => false))
        ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        // register an unrelated closed shadow root elsewhere in the document
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'closedHost', value: {
                    shadowRoot: { sharedId: 'closedShadowRoot', value: { nodeType: 11, mode: 'closed' } }
                } },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'unrelatedCtx' }
        } as any)

        // scope is a regular DOM element with no shadow-host descendants at all
        const result = await manager.getShadowElementsByContextId('unrelatedCtx', 'someUnrelatedElement')
        expect(result).toEqual([])
        expect(executeMock).toHaveBeenCalled()
    })

    it('should include a nested shadow host when scope is a plain DOM ancestor containing it', async () => {
        // batched containment check: report every candidate host as contained
        const executeMock = vi.fn().mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
            Promise.resolve(elements.map(() => true))
        ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'myWidget', value: {
                    shadowRoot: { sharedId: 'myWidgetShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'wrapperCtx' }
        } as any)

        // 'wrapperDiv' is a plain container that is never itself registered as a tree
        // node, but is confirmed (via the mocked DOM containment check) to contain
        // 'myWidget' further down the light DOM
        const result = await manager.getShadowElementsByContextId('wrapperCtx', 'wrapperDiv')
        expect(result).toEqual(['myWidgetShadow'])

        const pairs = await manager.getShadowElementPairsByContextId('wrapperCtx', 'wrapperDiv')
        expect(pairs).toEqual([['myWidget', 'myWidgetShadow']])
    })

    it('should not duplicate a nested shadow host already covered by a contained ancestor host', async () => {
        // batched containment check: report every candidate host as contained
        const executeMock = vi.fn().mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
            Promise.resolve(elements.map(() => true))
        ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        // outer host with its own shadow root
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'outerHost', value: {
                    shadowRoot: { sharedId: 'outerShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'nestedCtx' }
        } as any)
        // inner host nested inside outerHost's own shadow root
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'innerHost', value: {
                    shadowRoot: { sharedId: 'innerShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'outerShadow' },
                { type: 'boolean', value: false },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'nestedCtx' }
        } as any)

        const result = await manager.getShadowElementsByContextId('nestedCtx', 'wrapperDiv')
        // outerHost's own lookup scopes already recursively include innerShadow;
        // innerHost must not be listed a second time as an independent contained host
        expect(result).toEqual(['outerShadow', 'innerShadow'])
        expect(new Set(result).size).toBe(result.length)
    })

    it('should check containment for multiple hosts in a single batched execute call', async () => {
        const executeMock = vi.fn().mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
            Promise.resolve(elements.map(() => true))
        ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        // three independent (non-nested) hosts anywhere in the document
        for (const [host, shadow] of [['hostA', 'shadowA'], ['hostB', 'shadowB'], ['hostC', 'shadowC']]) {
            manager.handleLogEntry({
                level: 'debug',
                args: [
                    { type: 'string', value: '[WDIO]' },
                    { type: 'string', value: 'newShadowRoot' },
                    { type: 'node', sharedId: host, value: {
                        shadowRoot: { sharedId: shadow, value: { nodeType: 11, mode: 'open' } }
                    } },
                    { type: 'node', sharedId: 'docRoot' },
                    { type: 'boolean', value: false },
                    { type: 'node', sharedId: 'docRoot' }
                ],
                source: { context: 'batchCtx' }
            } as any)
        }

        const result = await manager.getShadowElementsByContextId('batchCtx', 'wrapperDiv')
        expect(result).toEqual(['shadowA', 'shadowB', 'shadowC'])
        // a single round trip should check containment for all 3 hosts at once,
        // instead of one execute() call per host
        expect(executeMock).toHaveBeenCalledTimes(1)
        expect(executeMock.mock.calls[0][2]).toHaveLength(3)
    })

    it('should prune a stale host after its per-host fallback check throws, so later batches recover', async () => {
        // batch fails (stale host poisons it), per-host fallback: hostGood is
        // contained, hostStale throws → hostStale must be pruned from the tree
        // so the NEXT lookup's batch only contains hostGood and succeeds again
        const executeMock = vi.fn()
            .mockRejectedValueOnce(new Error('stale host poisons batch'))       // 1st batch
            .mockResolvedValueOnce(true)                                        // per-host hostGood
            .mockRejectedValueOnce(new Error('stale element reference'))        // per-host hostStale
            .mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
                Promise.resolve((elements as unknown[]).map(() => true))        // 2nd batch succeeds
            ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        for (const [host, shadow] of [['hostGood', 'shadowGood'], ['hostStale', 'shadowStale']]) {
            manager.handleLogEntry({
                level: 'debug',
                args: [
                    { type: 'string', value: '[WDIO]' },
                    { type: 'string', value: 'newShadowRoot' },
                    { type: 'node', sharedId: host, value: {
                        shadowRoot: { sharedId: shadow, value: { nodeType: 11, mode: 'open' } }
                    } },
                    { type: 'node', sharedId: 'docRoot' },
                    { type: 'boolean', value: false },
                    { type: 'node', sharedId: 'docRoot' }
                ],
                source: { context: 'pruneCtx' }
            } as any)
        }

        const first = await manager.getShadowElementsByContextId('pruneCtx', 'wrapperDiv')
        expect(first).toEqual(['shadowGood'])

        // stale host was pruned: the next call goes back to a single successful
        // batched round trip over the remaining host only
        const second = await manager.getShadowElementsByContextId('pruneCtx', 'wrapperDiv')
        expect(second).toEqual(['shadowGood'])
        expect(executeMock).toHaveBeenCalledTimes(4)
        expect(executeMock.mock.calls[3][2]).toHaveLength(1)
    })

    it('should fall back to per-element checks when the batched check returns a malformed result', async () => {
        // batch resolves but returns 1 result for 2 hosts (buggy driver) — the
        // helper must treat that as a batch failure and fall back per-element
        const executeMock = vi.fn()
            .mockResolvedValueOnce([true])   // malformed batch: wrong length
            .mockResolvedValueOnce(true)     // per-host hostM → contained
            .mockResolvedValueOnce(false)    // per-host hostN → not contained
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        for (const [host, shadow] of [['hostM', 'shadowM'], ['hostN', 'shadowN']]) {
            manager.handleLogEntry({
                level: 'debug',
                args: [
                    { type: 'string', value: '[WDIO]' },
                    { type: 'string', value: 'newShadowRoot' },
                    { type: 'node', sharedId: host, value: {
                        shadowRoot: { sharedId: shadow, value: { nodeType: 11, mode: 'open' } }
                    } },
                    { type: 'node', sharedId: 'docRoot' },
                    { type: 'boolean', value: false },
                    { type: 'node', sharedId: 'docRoot' }
                ],
                source: { context: 'malformedCtx' }
            } as any)
        }

        const result = await manager.getShadowElementsByContextId('malformedCtx', 'wrapperDiv')
        expect(result).toEqual(['shadowM'])
        // 1 malformed batched call + 2 per-host fallback calls
        expect(executeMock).toHaveBeenCalledTimes(3)
    })

    it('should not prune a stale host while a host nested under it passed its containment check', async () => {
        // batch fails; per-host fallback: outer host throws (stale reference)
        // but the inner host nested in its shadow root is alive and contained.
        // Pruning the outer host would remove the healthy inner host with it.
        const executeMock = vi.fn()
            .mockRejectedValueOnce(new Error('stale host poisons batch'))  // 1st batch
            .mockRejectedValueOnce(new Error('stale element reference'))   // per-host outerHost (pre-order first)
            .mockResolvedValueOnce(true)                                   // per-host innerHost → contained
            .mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
                Promise.resolve((elements as unknown[]).map(() => true))   // later batches succeed
            ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'outerHost', value: {
                    shadowRoot: { sharedId: 'outerShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'nestedPruneCtx' }
        } as any)
        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'innerHost', value: {
                    shadowRoot: { sharedId: 'innerShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'outerShadow' },
                { type: 'boolean', value: false },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'nestedPruneCtx' }
        } as any)

        const first = await manager.getShadowElementsByContextId('nestedPruneCtx', 'wrapperDiv')
        expect(first).toEqual(['innerShadow'])

        // outerHost must NOT have been pruned (its subtree holds the healthy
        // innerHost) — both are still tracked on the next lookup
        const second = await manager.getShadowElementsByContextId('nestedPruneCtx', 'wrapperDiv')
        expect(second).toEqual(['outerShadow', 'innerShadow'])
    })

    it('should not prune any host when every containment check fails (scope itself is likely stale)', async () => {
        const executeMock = vi.fn()
            .mockRejectedValueOnce(new Error('batch fails'))
            .mockRejectedValueOnce(new Error('scope is stale'))
            .mockRejectedValueOnce(new Error('scope is stale'))
            .mockImplementation((_script: unknown, _scope: unknown, elements: unknown[]) => (
                Promise.resolve((elements as unknown[]).map(() => true))
            ))
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        for (const [host, shadow] of [['hostX', 'shadowX'], ['hostY', 'shadowY']]) {
            manager.handleLogEntry({
                level: 'debug',
                args: [
                    { type: 'string', value: '[WDIO]' },
                    { type: 'string', value: 'newShadowRoot' },
                    { type: 'node', sharedId: host, value: {
                        shadowRoot: { sharedId: shadow, value: { nodeType: 11, mode: 'open' } }
                    } },
                    { type: 'node', sharedId: 'docRoot' },
                    { type: 'boolean', value: false },
                    { type: 'node', sharedId: 'docRoot' }
                ],
                source: { context: 'staleScopeCtx' }
            } as any)
        }

        const first = await manager.getShadowElementsByContextId('staleScopeCtx', 'staleWrapper')
        expect(first).toEqual([])

        // both hosts must still be tracked — a later lookup with a healthy scope
        // sees both again
        const second = await manager.getShadowElementsByContextId('staleScopeCtx', 'healthyWrapper')
        expect(second).toEqual(['shadowX', 'shadowY'])
    })

    it('should only return scopes of hosts the containment check marks as contained (index alignment)', async () => {
        // hostA is contained in the scope, hostB is not — a misaligned batch
        // result would leak hostB's shadow root (or drop hostA's)
        const executeMock = vi.fn().mockResolvedValue([true, false])
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)

        for (const [host, shadow] of [['hostA', 'shadowA'], ['hostB', 'shadowB']]) {
            manager.handleLogEntry({
                level: 'debug',
                args: [
                    { type: 'string', value: '[WDIO]' },
                    { type: 'string', value: 'newShadowRoot' },
                    { type: 'node', sharedId: host, value: {
                        shadowRoot: { sharedId: shadow, value: { nodeType: 11, mode: 'open' } }
                    } },
                    { type: 'node', sharedId: 'docRoot' },
                    { type: 'boolean', value: false },
                    { type: 'node', sharedId: 'docRoot' }
                ],
                source: { context: 'mixedCtx' }
            } as any)
        }

        const elements = await manager.getShadowElementsByContextId('mixedCtx', 'wrapperDiv')
        expect(elements).toEqual(['shadowA'])

        const pairs = await manager.getShadowElementPairsByContextId('mixedCtx', 'wrapperDiv')
        expect(pairs).toEqual([['hostA', 'shadowA']])
    })

    it('should fall back to per-host containment checks and log a warning when the batched check fails', async () => {
        const executeMock = vi.fn()
            .mockRejectedValueOnce(new Error('scope is stale'))
            .mockResolvedValue(true)
        const browser = { ...defaultBrowser, execute: executeMock } as any
        const manager = getShadowRootManager(browser)
        const warnSpy = vi.spyOn(logger('webdriverio'), 'warn')

        manager.handleLogEntry({
            level: 'debug',
            args: [
                { type: 'string', value: '[WDIO]' },
                { type: 'string', value: 'newShadowRoot' },
                { type: 'node', sharedId: 'myWidget', value: {
                    shadowRoot: { sharedId: 'myWidgetShadow', value: { nodeType: 11, mode: 'open' } }
                } },
                { type: 'node', sharedId: 'docRoot' }
            ],
            source: { context: 'fallbackCtx' }
        } as any)

        const result = await manager.getShadowElementsByContextId('fallbackCtx', 'wrapperDiv')
        expect(result).toEqual(['myWidgetShadow'])
        // 1 failed batched call + 1 successful per-host fallback call
        expect(executeMock).toHaveBeenCalledTimes(2)
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Falling back to per-element checks'))
    })

})

describe('ShadowRootTree', () => {
    const root = new ShadowRootTree('1')
    root.addShadowElement(new ShadowRootTree('2', '3'))
    root.addShadowElement(new ShadowRootTree('4', '5'))
    root.addShadowElement(new ShadowRootTree('6', '7'))
    root.addShadowElement('4', new ShadowRootTree('8', '9'))
    root.addShadowElement('8', new ShadowRootTree('10', '11'))
    root.addShadowElement('8', new ShadowRootTree('12', '13'))
    root.addShadowElement('12', new ShadowRootTree('14', '15'))
    root.addShadowElement(new ShadowRootTree('16', '17'))
    root.addShadowElement('16', new ShadowRootTree('18', '19'))
    root.addShadowElement('16', new ShadowRootTree('18', '19'))
    root.addShadowElement('18', new ShadowRootTree('20', '21'))

    it('can find the root of a tree', () => {
        const tree = root.find('8')
        expect(tree?.shadowRoot).toBe('9')
        expect(tree?.children.size).toBe(2)
        expect(root.find('1234')).toBe(undefined)
    })

    it('can findByShadowId', () => {
        expect(root.findByShadowId('9')?.element).toBe('8')
        expect(root.findByShadowId('15')?.element).toBe('14')
        expect(root.findByShadowId('1234')).toBe(undefined)
    })

    it('can get all trees', () => {
        expect(root.getAllLookupScopes()).toMatchInlineSnapshot(`
          [
            "1",
            "3",
            "5",
            "9",
            "11",
            "13",
            "15",
            "7",
            "17",
            "19",
            "21",
          ]
        `)
        expect(root.find('8')?.getAllLookupScopes()).toMatchInlineSnapshot(`
          [
            "9",
            "11",
            "13",
            "15",
          ]
        `)
    })

    it('can delete children and sub trees', () => {
        const child = root.find('6')
        expect(child?.remove('8')).toBe(false)
        expect(root.remove('8')).toBe(true)
        expect(root.getAllLookupScopes()).toMatchInlineSnapshot(`
          [
            "1",
            "3",
            "5",
            "7",
            "17",
            "19",
            "21",
          ]
        `)
    })

    it('can delete children in the right order', () => {
        expect(root.remove('18')).toBe(true)
        const child = root.find('16')
        expect(child?.getAllLookupScopes()).toMatchInlineSnapshot(`
          [
            "17",
          ]
        `)
    })
    it('should deduplicate children with same element id', () => {
        const root = new ShadowRootTree('root1', 'shadow1')
        const child1 = new ShadowRootTree('elem1', 'shadow-elem1')
        const child1dup = new ShadowRootTree('elem1', 'shadow-elem1-dup')
        const child2 = new ShadowRootTree('elem2', 'shadow-elem2')
        root.addShadowElement(child1)
        root.addShadowElement(child1dup)  // Duplicate — should be ignored
        root.addShadowElement(child2)
        expect(root.flat().length).toBe(3)  // root + child1 + child2 (not child1dup)
    })

})
