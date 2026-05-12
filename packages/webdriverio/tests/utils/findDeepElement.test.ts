import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import type * as WdioUtils from '@wdio/utils'

/**
 * Mock dependencies before importing the module under test
 */
const mockGetShadowElementsByContextId = vi.fn()
const mockGetCurrentContext = vi.fn()

vi.mock('@wdio/utils', async (importOriginal) => {
    const orig = await importOriginal<WdioUtils>()
    return {
        ...orig,
        getBrowserObject: vi.fn((self: any) => self.__browser || self),
    }
})

vi.mock('../../src/session/shadowRoot.js', () => ({
    getShadowRootManager: vi.fn(() => ({
        getShadowElementsByContextId: mockGetShadowElementsByContextId,
        deleteShadowRoot: vi.fn(),
    })),
}))

vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn(() => ({
        getCurrentContext: mockGetCurrentContext,
    })),
}))

vi.mock('is-plain-obj', () => ({
    default: vi.fn().mockReturnValue(false),
}))

import { findDeepElement, findDeepElements } from '../../src/utils/index.js'

/**
 * Helper to create a mock browser instance used as `this` context
 * for findDeepElement / findDeepElements.
 */
function createMockBrowser(overrides: Record<string, any> = {}) {
    const browser: any = {
        isW3C: true,
        isMobile: false,
        browsingContextLocateNodes: vi.fn(),
        execute: vi.fn(),
        findElement: vi.fn(),
        findElements: vi.fn(),
        findElementFromElement: vi.fn(),
        findElementsFromElement: vi.fn(),
        ...overrides,
    }
    // getBrowserObject(this) returns this.__browser || this
    browser.__browser = browser
    return browser
}

describe('findDeepElement - isConnected validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetCurrentContext.mockResolvedValue('ctx-1')
    })

    it('should return the first connected node when shadow roots exist (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1', 'shadow-2'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'node-detached-1' },
                { sharedId: 'node-connected' },
                { sharedId: 'node-detached-2' },
            ],
        })
        // First node: detached, second: connected, third: never reached
        browser.execute
            .mockResolvedValueOnce(false)  // node-detached-1 → not connected
            .mockResolvedValueOnce(true)   // node-connected → connected

        const result = await findDeepElement.call(browser, '[data-qa="my-btn"]')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'node-connected',
            locator: expect.objectContaining({ type: 'css', value: '[data-qa="my-btn"]' }),
        })
        // Should have called execute twice (stopped at first connected)
        expect(browser.execute).toHaveBeenCalledTimes(2)
        // Should NOT fall back to Classic
        expect(browser.findElement).not.toHaveBeenCalled()
    })

    it('should fall back to Classic findElement when all BiDi nodes are detached (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'node-stale-1' },
                { sharedId: 'node-stale-2' },
            ],
        })
        browser.execute
            .mockResolvedValueOnce(false)  // node-stale-1 → not connected
            .mockResolvedValueOnce(false)  // node-stale-2 → not connected

        const classicResult = { [ELEMENT_KEY]: 'classic-element' }
        browser.findElement.mockResolvedValue(classicResult)

        const result = await findDeepElement.call(browser, '[data-qa="my-btn"]')

        // Classic fallback removed - returns undefined for retry
        expect(result).toBeUndefined()
        expect(browser.findElement).not.toHaveBeenCalled()
    })

    it('should handle execute throwing for stale elements (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'node-gc' },
                { sharedId: 'node-ok' },
            ],
        })
        browser.execute
            .mockRejectedValueOnce(new Error('no such element'))  // node-gc → stale/GC'd
            .mockResolvedValueOnce(true)  // node-ok → connected

        const result = await findDeepElement.call(browser, '.my-class')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'node-ok',
            locator: expect.objectContaining({ type: 'css', value: '.my-class' }),
        })
    })

    it('should return first node directly when no shadow roots (no isConnected check)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])  // no shadow roots

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [{ sharedId: 'direct-node' }],
        })

        const result = await findDeepElement.call(browser, '#myId')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'direct-node',
            locator: expect.objectContaining({ type: 'css', value: '#myId' }),
        })
        // No isConnected check should happen
        expect(browser.execute).not.toHaveBeenCalled()
    })

    it('should filter detached scoped nodes and fall back to Classic (scoped/element context)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'parent-elem-id',
            __browser: browser,
            findElementFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'scoped-node-1' },
                { sharedId: 'scoped-node-2' },
            ],
        })

        // elementContains calls: both nodes are "in" the parent
        // isConnected calls: both nodes are detached
        browser.execute
            .mockResolvedValueOnce(true)   // elementContains for scoped-node-1
            .mockResolvedValueOnce(true)   // elementContains for scoped-node-2
            .mockResolvedValueOnce(false)  // isConnected for scoped-node-1
            .mockResolvedValueOnce(false)  // isConnected for scoped-node-2

        const classicResult = { [ELEMENT_KEY]: 'fallback-element' }
        element.findElementFromElement.mockResolvedValue(classicResult)

        const result = await findDeepElement.call(element, '.child-selector')

        // Classic fallback removed — returns undefined for retry
        expect(result).toBeUndefined()
    })

    it('should return first connected scoped node (scoped/element context)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'parent-elem-id',
            __browser: browser,
            findElementFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'scoped-detached' },
                { sharedId: 'scoped-connected' },
            ],
        })

        // elementContains: both are in parent
        // isConnected: first detached, second connected
        browser.execute
            .mockResolvedValueOnce(true)   // elementContains for scoped-detached
            .mockResolvedValueOnce(true)   // elementContains for scoped-connected
            .mockResolvedValueOnce(false)  // isConnected for scoped-detached
            .mockResolvedValueOnce(true)   // isConnected for scoped-connected

        const result = await findDeepElement.call(element, '.child-selector')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'scoped-connected',
            locator: expect.objectContaining({ type: 'css', value: '.child-selector' }),
        })
        // Should NOT fall back to Classic since we found a connected node
        expect(element.findElementFromElement).not.toHaveBeenCalled()
    })
})

describe('findDeepElements - isConnected validation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetCurrentContext.mockResolvedValue('ctx-1')
    })

    it('should filter out detached nodes and return only connected ones (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'node-a' },
                { sharedId: 'node-b' },
                { sharedId: 'node-c' },
            ],
        })
        browser.execute
            .mockResolvedValueOnce(true)   // node-a → connected
            .mockResolvedValueOnce(false)  // node-b → detached
            .mockResolvedValueOnce(true)   // node-c → connected

        const result = await findDeepElements.call(browser, '[data-qa="items"]')

        expect(result).toEqual([
            { [ELEMENT_KEY]: 'node-a', locator: expect.objectContaining({ type: 'css', value: '[data-qa="items"]' }) },
            { [ELEMENT_KEY]: 'node-c', locator: expect.objectContaining({ type: 'css', value: '[data-qa="items"]' }) },
        ])
        expect(browser.findElements).not.toHaveBeenCalled()
    })

    it('should fall back to Classic findElements when all nodes are detached (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'stale-1' },
                { sharedId: 'stale-2' },
            ],
        })
        browser.execute
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(false)

        const classicResults = [
            { [ELEMENT_KEY]: 'classic-1' },
            { [ELEMENT_KEY]: 'classic-2' },
        ]
        browser.findElements.mockResolvedValue(classicResults)

        const result = await findDeepElements.call(browser, '.card')

        // Classic fallback removed — returns empty array for retry
        expect(result).toEqual([])
    })

    it('should handle execute throwing for stale elements (unscoped)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'gc-node' },
                { sharedId: 'ok-node' },
            ],
        })
        browser.execute
            .mockRejectedValueOnce(new Error('no such element'))
            .mockResolvedValueOnce(true)

        const result = await findDeepElements.call(browser, '.item')

        expect(result).toEqual([
            { [ELEMENT_KEY]: 'ok-node', locator: expect.objectContaining({ type: 'css', value: '.item' }) },
        ])
    })

    it('should return all nodes directly when no shadow roots (no isConnected check)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])

        const browser = createMockBrowser()
        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'n1' },
                { sharedId: 'n2' },
            ],
        })

        const result = await findDeepElements.call(browser, 'div')

        expect(result).toEqual([
            { [ELEMENT_KEY]: 'n1', locator: expect.objectContaining({ type: 'css', value: 'div' }) },
            { [ELEMENT_KEY]: 'n2', locator: expect.objectContaining({ type: 'css', value: 'div' }) },
        ])
        expect(browser.execute).not.toHaveBeenCalled()
    })

    it('should filter detached scoped nodes and fall back to Classic (scoped/element context)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'parent-elem',
            __browser: browser,
            findElementsFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'child-1' },
                { sharedId: 'child-2' },
            ],
        })

        // elementContains: both in parent; isConnected: both detached
        browser.execute
            .mockResolvedValueOnce(true)   // elementContains child-1
            .mockResolvedValueOnce(true)   // elementContains child-2
            .mockResolvedValueOnce(false)  // isConnected child-1
            .mockResolvedValueOnce(false)  // isConnected child-2

        const classicResults = [{ [ELEMENT_KEY]: 'classic-child' }]
        element.findElementsFromElement.mockResolvedValue(classicResults)

        const result = await findDeepElements.call(element, '.child')

        // Classic fallback removed — returns empty array for retry
        expect(result).toEqual([])
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    it('should return connected scoped nodes only (scoped/element context)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'parent-elem',
            __browser: browser,
            findElementsFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'child-ok' },
                { sharedId: 'child-stale' },
            ],
        })

        // elementContains: both in parent; isConnected: first connected, second detached
        browser.execute
            .mockResolvedValueOnce(true)   // elementContains child-ok
            .mockResolvedValueOnce(true)   // elementContains child-stale
            .mockResolvedValueOnce(true)   // isConnected child-ok
            .mockResolvedValueOnce(false)  // isConnected child-stale

        const result = await findDeepElements.call(element, '.child')

        // Should contain only the connected node
        expect(result).toHaveLength(1)
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })
})
