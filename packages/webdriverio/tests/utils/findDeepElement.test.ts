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
        // isConnected (batched): first detached, second connected, third detached
        browser.execute
            .mockResolvedValueOnce([false, true, false])

        const result = await findDeepElement.call(browser, '[data-qa="my-btn"]')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'node-connected',
            locator: expect.objectContaining({ type: 'css', value: '[data-qa="my-btn"]' }),
        })
        // a single batched isConnected round trip covers all nodes
        expect(browser.execute).toHaveBeenCalledTimes(1)
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
            .mockResolvedValueOnce([false, false])  // batched isConnected: both detached

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
            .mockRejectedValueOnce(new Error('no such element'))  // batched isConnected fails (stale node poisons it)
            .mockRejectedValueOnce(new Error('no such element'))  // per-element fallback: node-gc → stale/GC'd
            .mockResolvedValueOnce(true)                          // per-element fallback: node-ok → connected

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

        // containment check (batched): both nodes are "in" the parent
        // isConnected calls: both nodes are detached
        browser.execute
            .mockResolvedValueOnce([true, true])    // batched containment for both nodes
            .mockResolvedValueOnce([false, false])  // batched isConnected: both detached

        const classicResult = { [ELEMENT_KEY]: 'fallback-element' }
        element.findElementFromElement.mockResolvedValue(classicResult)

        const result = await findDeepElement.call(element, '.child-selector')

        // Classic fallback removed — returns undefined for retry
        expect(result).toBeUndefined()
    })

    it('should return scoped nodes directly when no shadow roots, without isConnected check (e.g. select>option)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])  // no shadow roots — regular DOM element like <select>

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'select-elem-id',
            __browser: browser,
            findElementFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'option-1' },
                { sharedId: 'option-2' },
            ],
        })

        // containment check (batched): option-1 is in select, option-2 is not (to test scoping)
        browser.execute
            .mockResolvedValueOnce([true, false])

        const result = await findDeepElement.call(element, 'option')

        // Should return the first scoped node without any isConnected check
        expect(result).toEqual({
            [ELEMENT_KEY]: 'option-1',
            locator: expect.objectContaining({ type: 'css', value: 'option' }),
        })
        // Only the single batched containment call, no isConnected calls
        expect(browser.execute).toHaveBeenCalledTimes(1)
        expect(element.findElementFromElement).not.toHaveBeenCalled()
    })

    it('should include both the scope element and its shadow roots as startNodes (scoped/element context)', async () => {
        // regression test: a scope that contains a shadow host must still search
        // its own plain light-DOM descendants alongside the shadow root(s)
        mockGetShadowElementsByContextId.mockReturnValue(['shadow-1'])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'wrapper-elem-id',
            __browser: browser,
            findElementFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({ nodes: [] })

        await findDeepElement.call(element, '.child-selector')

        expect(browser.browsingContextLocateNodes).toHaveBeenCalledWith(
            expect.objectContaining({
                startNodes: [
                    { sharedId: 'wrapper-elem-id' },
                    { sharedId: 'shadow-1' },
                ],
            })
        )
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

        // containment check (batched): both are in parent
        // isConnected: first detached, second connected
        browser.execute
            .mockResolvedValueOnce([true, true])   // batched containment for both nodes
            .mockResolvedValueOnce([false, true])  // batched isConnected: first detached, second connected

        const result = await findDeepElement.call(element, '.child-selector')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'scoped-connected',
            locator: expect.objectContaining({ type: 'css', value: '.child-selector' }),
        })
        // Should NOT fall back to Classic since we found a connected node
        expect(element.findElementFromElement).not.toHaveBeenCalled()
    })

    it('should fall back to per-element containment checks when the batched check fails (scoped/element context)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])

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
                { sharedId: 'node-in-scope' },
                { sharedId: 'node-stale' },
            ],
        })

        // batched containment throws, per-element fallback: first in scope, second stale
        browser.execute
            .mockRejectedValueOnce(new Error('stale element reference'))
            .mockResolvedValueOnce(true)                                  // per-element check node-in-scope
            .mockRejectedValueOnce(new Error('stale element reference'))  // per-element check node-stale

        const result = await findDeepElement.call(element, '.child-selector')

        expect(result).toEqual({
            [ELEMENT_KEY]: 'node-in-scope',
            locator: expect.objectContaining({ type: 'css', value: '.child-selector' }),
        })
        // 1 failed batched call + 2 per-element fallback calls
        expect(browser.execute).toHaveBeenCalledTimes(3)
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
            .mockResolvedValueOnce([true, false, true])  // batched isConnected: node-b detached

        const result = await findDeepElements.call(browser, '[data-qa="items"]')

        expect(result).toEqual([
            { [ELEMENT_KEY]: 'node-a', locator: expect.objectContaining({ type: 'css', value: '[data-qa="items"]' }) },
            { [ELEMENT_KEY]: 'node-c', locator: expect.objectContaining({ type: 'css', value: '[data-qa="items"]' }) },
        ])
        // all nodes checked in a single batched isConnected round trip
        expect(browser.execute).toHaveBeenCalledTimes(1)
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
            .mockResolvedValueOnce([false, false])  // batched isConnected: both detached

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
            .mockRejectedValueOnce(new Error('no such element'))  // batched isConnected fails (stale node poisons it)
            .mockRejectedValueOnce(new Error('no such element'))  // per-element fallback: gc-node stale
            .mockResolvedValueOnce(true)                          // per-element fallback: ok-node connected

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

        // containment check (batched): both in parent; isConnected (batched): both detached
        browser.execute
            .mockResolvedValueOnce([true, true])    // batched containment for both nodes
            .mockResolvedValueOnce([false, false])  // batched isConnected: both detached

        const classicResults = [{ [ELEMENT_KEY]: 'classic-child' }]
        element.findElementsFromElement.mockResolvedValue(classicResults)

        const result = await findDeepElements.call(element, '.child')

        // Classic fallback removed — returns empty array for retry
        expect(result).toEqual([])
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    it('should return all scoped nodes directly when no shadow roots, without isConnected check (e.g. select>option)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])  // no shadow roots — regular DOM element like <select>

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'select-elem-id',
            __browser: browser,
            findElementsFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'option-1' },
                { sharedId: 'option-2' },
                { sharedId: 'option-3' },
            ],
        })

        // containment check (batched): all options are within the select
        browser.execute
            .mockResolvedValueOnce([true, true, true])

        const result = await findDeepElements.call(element, 'option')

        // Should return all scoped nodes without any isConnected check
        expect(result).toHaveLength(3)
        expect(result).toEqual([
            { [ELEMENT_KEY]: 'option-1', locator: expect.objectContaining({ type: 'css', value: 'option' }) },
            { [ELEMENT_KEY]: 'option-2', locator: expect.objectContaining({ type: 'css', value: 'option' }) },
            { [ELEMENT_KEY]: 'option-3', locator: expect.objectContaining({ type: 'css', value: 'option' }) },
        ])
        // Only the single batched containment call, no isConnected calls
        expect(browser.execute).toHaveBeenCalledTimes(1)
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    it('should keep only the nodes the batched containment check marks as contained (index alignment)', async () => {
        mockGetShadowElementsByContextId.mockReturnValue([])

        const browser = createMockBrowser()
        const element: any = {
            isW3C: true,
            isMobile: false,
            elementId: 'select-elem-id',
            __browser: browser,
            findElementsFromElement: vi.fn(),
        }

        browser.browsingContextLocateNodes.mockResolvedValue({
            nodes: [
                { sharedId: 'option-1' },
                { sharedId: 'option-2' },
                { sharedId: 'option-3' },
            ],
        })

        // only the middle node is contained in the scope — a misaligned
        // batch result would keep the wrong node(s)
        browser.execute.mockResolvedValueOnce([false, true, false])

        const result = await findDeepElements.call(element, 'option')

        expect(result).toEqual([
            { [ELEMENT_KEY]: 'option-2', locator: expect.objectContaining({ type: 'css', value: 'option' }) },
        ])
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

        // containment check (batched): both in parent; isConnected (batched): first connected, second detached
        browser.execute
            .mockResolvedValueOnce([true, true])   // batched containment for both nodes
            .mockResolvedValueOnce([true, false])  // batched isConnected: child-ok connected, child-stale detached

        const result = await findDeepElements.call(element, '.child')

        // Should contain only the connected node
        expect(result).toHaveLength(1)
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })
})
