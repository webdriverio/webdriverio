import { describe, it, vi, expect, beforeEach } from 'vitest'

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

    it('should capture shadow root elements', () => {
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
        expect(manager.getShadowElementsByContextId('foobarContext')).toEqual(['barfoo', 'shadowFoobar'])
        expect(manager.getShadowRootModeById('foobarContext', 'foobar')).toBe('closed')
        expect(manager.getShadowElementPairsByContextId('foobarContext')).toEqual([
            ['barfoo', undefined],
            ['foobar', 'shadowFoobar']
        ])
    })

    it('should ignore log entries that are not of interest', () => {
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
        expect(manager.getShadowElementsByContextId('foobarContext')).toEqual([])
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

    it('should handle removeShadowRoot without sharedId gracefully', () => {
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
        expect(manager.getShadowElementsByContextId('spaContext')).toContain('shadow1')

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

    it('should remove shadow root when removeShadowRoot has valid sharedId', () => {
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
        expect(manager.getShadowElementsByContextId('removeContext')).toContain('shadowA')

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
        expect(manager.getShadowElementsByContextId('removeContext')).not.toContain('shadowA')
    })

    it('should purge old shadow roots when document ID changes', () => {
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

        let elements = manager.getShadowElementsByContextId('ctx1')
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

        elements = manager.getShadowElementsByContextId('ctx1')
        // Should only contain elements from document B, not document A
        const hasDocA = elements.some(e => e.includes('AAAA0000'))
        const hasDocB = elements.some(e => e.includes('BBBB0000'))
        expect(hasDocA).toBe(false)
        expect(hasDocB).toBe(true)
    })

    it('should not purge when document ID stays the same', () => {
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

        const elements = manager.getShadowElementsByContextId('ctx1')
        // Should have both elements since same document
        expect(elements.filter(e => e.includes('AAAA0000')).length).toBeGreaterThanOrEqual(2)
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
