import { describe, it, vi, expect, beforeEach } from 'vitest'

import { getShadowRootManager, ShadowRootTree } from '../src/shadowRoot.js'

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
        const wid = process.env.WDIO_UNIT_TESTS
        delete process.env.WDIO_UNIT_TESTS
        const browser = { ...defaultBrowser, isBidi: true, options: { automationProtocol: 'webdriver' } } as any
        const manager = getShadowRootManager(browser)
        process.env.WDIO_UNIT_TESTS = wid
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(1)
        expect(browser.on).toBeCalledTimes(3)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(1)
    })

    it('should not register event listeners if not in bidi mode', async () => {
        const browser = { ...defaultBrowser } as any
        const manager = getShadowRootManager(browser)
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(0)
        expect(browser.on).toBeCalledTimes(0)
        expect(browser.scriptAddPreloadScript).toBeCalledTimes(0)
    })

    it('should not register event listeners if not using webdriver as automation protocol', async () => {
        const browser = { ...defaultBrowser, isBidi: true, automationProtocol: './protocol-stub.js' } as any
        const manager = getShadowRootManager(browser)
        expect(await manager.initialize()).toBe(true)
        expect(browser.sessionSubscribe).toBeCalledTimes(0)
        expect(browser.on).toBeCalledTimes(0)
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
            "19",
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
            "19",
          ]
        `)
    })

    it('can delete children in the right order', () => {
        expect(root.remove('18')).toBe(true)
        const child = root.find('16')
        expect(child?.getAllLookupScopes()).toMatchInlineSnapshot(`
          [
            "17",
            "19",
            "21",
          ]
        `)
    })
})
