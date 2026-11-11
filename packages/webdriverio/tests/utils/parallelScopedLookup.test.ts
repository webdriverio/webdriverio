import { describe, it, expect, vi, beforeEach } from 'vitest'
import type * as WdioUtils from '@wdio/utils'
import { ELEMENT_KEY } from 'webdriver'

const parallelStore = vi.hoisted(() => ({ value: undefined as string | undefined }))

vi.mock('@wdio/utils', async (importOriginal) => {
    const orig = await importOriginal<typeof WdioUtils>()
    return { ...orig, getBrowserObject: vi.fn((self: any) => self.__browser || self) }
})

vi.mock('../../src/session/shadowRoot.js', () => ({
    getShadowRootManager: vi.fn(() => ({
        getShadowElementsByContextId: vi.fn().mockResolvedValue([]),
        deleteShadowRoot: vi.fn(),
        forgetNode: vi.fn(),
        isWithinFrame: () => false
    }))
}))

vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn(() => ({ getCurrentContext: vi.fn().mockResolvedValue('ctx-1') })),
    getParallelContextStore: vi.fn(() => ({ getStore: () => parallelStore.value }))
}))

vi.mock('is-plain-obj', () => ({ default: vi.fn().mockReturnValue(false) }))

import { findDeepElement, findDeepElements, findElement } from '../../src/utils/index.js'
import { shadow$ } from '../../src/commands/element/shadow$.js'
import { shadow$$ } from '../../src/commands/element/shadow$$.js'

function setup() {
    const browser: any = {
        isBidi: true,
        isMobile: false,
        browsingContextLocateNodes: vi.fn().mockResolvedValue({ nodes: [{ sharedId: 'child-1' }, { sharedId: 'child-2' }] }),
        executeScript: vi.fn(),
        getElementShadowRoot: vi.fn(),
        findElementFromElement: vi.fn(),
        findElementsFromElement: vi.fn()
    }
    browser.__browser = browser
    const element: any = {
        isBidi: true,
        isMobile: false,
        elementId: 'parent-id',
        parent: browser,
        __browser: browser,
        execute: vi.fn().mockResolvedValue({ [ELEMENT_KEY]: 'found' }),
        findElementFromElement: browser.findElementFromElement,
        findElementsFromElement: browser.findElementsFromElement,
        $: vi.fn().mockResolvedValue('shadow-el'),
        $$: vi.fn().mockResolvedValue(['a', 'b'])
    }
    return { browser, element }
}

describe('element-scoped lookups while a parallel test context is active', () => {
    beforeEach(() => {
        parallelStore.value = 'ctx-1'
    })

    it('relative xpath $ uses locateNodes with the parent as startNode', async () => {
        const { browser, element } = setup()
        const res = await findDeepElement.call(element, './input[@id="x"]')
        expect(res).toEqual({ [ELEMENT_KEY]: 'child-1' })
        expect(browser.browsingContextLocateNodes).toHaveBeenCalledWith({
            locator: { type: 'xpath', value: './input[@id="x"]' },
            context: 'ctx-1',
            startNodes: [{ sharedId: 'parent-id' }]
        })
        expect(element.findElementFromElement).not.toHaveBeenCalled()
    })

    it('relative xpath $$ uses locateNodes with the parent as startNode', async () => {
        const { browser, element } = setup()
        const res = await findDeepElements.call(element, '../div')
        expect(res).toEqual([{ [ELEMENT_KEY]: 'child-1' }, { [ELEMENT_KEY]: 'child-2' }])
        expect(browser.browsingContextLocateNodes).toHaveBeenCalledWith(expect.objectContaining({
            startNodes: [{ sharedId: 'parent-id' }]
        }))
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    it('function selector runs through BiDi execute, not classic executeScript', async () => {
        const { browser, element } = setup()
        const res = await findElement.call(element, function () { return document.body } as any)
        expect(res).toEqual({ [ELEMENT_KEY]: 'found' })
        expect(element.execute).toHaveBeenCalled()
        expect(browser.executeScript).not.toHaveBeenCalled()
    })

    it('shadow$ and shadow$$ skip the classic shadow root endpoints', async () => {
        const { browser, element } = setup()
        expect(await shadow$.call(element, 'input')).toBe('shadow-el')
        await shadow$$.call(element, 'button')
        expect(element.$).toHaveBeenCalled()
        expect(browser.getElementShadowRoot).not.toHaveBeenCalled()
    })

    it('element-scoped $ and $$ rethrow a BiDi locate rejection instead of classic find from element', async () => {
        const { browser, element } = setup()
        browser.browsingContextLocateNodes.mockRejectedValue(new Error('locate failed'))
        await expect(findDeepElement.call(element, '#x')).rejects.toThrow('locate failed')
        await expect(findDeepElements.call(element, '#x')).rejects.toThrow('locate failed')
        expect(element.findElementFromElement).not.toHaveBeenCalled()
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    describe('browser-level lookups never reach the session window through classic', () => {
        function browserSetup() {
            const { browser } = setup()
            browser.findElement = vi.fn().mockResolvedValue({ [ELEMENT_KEY]: 'classic' })
            browser.findElements = vi.fn().mockResolvedValue([{ [ELEMENT_KEY]: 'classic' }])
            return browser
        }

        it('$ rethrows a BiDi locate rejection instead of calling findElement', async () => {
            const browser = browserSetup()
            browser.browsingContextLocateNodes.mockRejectedValue(new Error('locate failed'))
            await expect(findDeepElement.call(browser, '#x')).rejects.toThrow('locate failed')
            expect(browser.findElement).not.toHaveBeenCalled()
        })

        it('$$ rethrows a BiDi locate rejection instead of calling findElements', async () => {
            const browser = browserSetup()
            browser.browsingContextLocateNodes.mockRejectedValue(new Error('locate failed'))
            await expect(findDeepElements.call(browser, '#x')).rejects.toThrow('locate failed')
            expect(browser.findElements).not.toHaveBeenCalled()
        })

        it('aria not found retries the XPath over BiDi on the root document', async () => {
            const browser = browserSetup()
            browser.browsingContextLocateNodes
                .mockResolvedValueOnce({ nodes: [] })
                .mockResolvedValueOnce({ nodes: [{ sharedId: 'x1' }] })
            expect(await findDeepElement.call(browser, 'aria/Foo')).toEqual(expect.objectContaining({ [ELEMENT_KEY]: 'x1' }))
            expect(browser.browsingContextLocateNodes).toHaveBeenLastCalledWith(expect.objectContaining({
                context: 'ctx-1',
                locator: expect.objectContaining({ type: 'xpath' })
            }))
            expect(browser.findElement).not.toHaveBeenCalled()
        })

        it('aria not found anywhere returns not-found without classic', async () => {
            const browser = browserSetup()
            browser.browsingContextLocateNodes.mockResolvedValue({ nodes: [] })
            expect(await findDeepElement.call(browser, 'aria/Foo')).toBeUndefined()
            expect(await findDeepElements.call(browser, 'aria/Foo')).toEqual([])
            expect(browser.findElement).not.toHaveBeenCalled()
            expect(browser.findElements).not.toHaveBeenCalled()
        })

        it('aria XPath rejection is rethrown without classic', async () => {
            const browser = browserSetup()
            browser.browsingContextLocateNodes.mockRejectedValue(new Error('boom'))
            await expect(findDeepElement.call(browser, 'aria/Foo')).rejects.toThrow('boom')
            await expect(findDeepElements.call(browser, 'aria/Foo')).rejects.toThrow('boom')
            expect(browser.findElement).not.toHaveBeenCalled()
            expect(browser.findElements).not.toHaveBeenCalled()
        })
    })

    it('element-scoped aria with no match returns not-found without classic find from element', async () => {
        const { browser, element } = setup()
        browser.browsingContextLocateNodes.mockResolvedValue({ nodes: [] })
        expect(await findDeepElement.call(element, 'aria/Foo')).toBeUndefined()
        expect(await findDeepElements.call(element, 'aria/Foo')).toEqual([])
        expect(browser.browsingContextLocateNodes).toHaveBeenLastCalledWith(expect.objectContaining({
            startNodes: [{ sharedId: 'parent-id' }]
        }))
        expect(element.findElementFromElement).not.toHaveBeenCalled()
        expect(element.findElementsFromElement).not.toHaveBeenCalled()
    })

    describe('without a parallel context (unchanged)', () => {
        beforeEach(() => {
            parallelStore.value = undefined
        })

        it('relative xpath $ and $$ still use classic find from element', async () => {
            const { element } = setup()
            element.findElementFromElement.mockResolvedValue({ [ELEMENT_KEY]: 'classic' })
            element.findElementsFromElement.mockResolvedValue([])
            expect(await findDeepElement.call(element, './input')).toEqual({ [ELEMENT_KEY]: 'classic' })
            await findDeepElements.call(element, './input')
            expect(element.findElementFromElement).toHaveBeenCalledWith('parent-id', 'xpath', './input')
            expect(element.findElementsFromElement).toHaveBeenCalledWith('parent-id', 'xpath', './input')
        })

        it('function selector still uses classic executeScript', async () => {
            const { browser, element } = setup()
            browser.executeScript.mockResolvedValue({ [ELEMENT_KEY]: 'classic' })
            await findElement.call(element, function () { return document.body } as any)
            expect(browser.executeScript).toHaveBeenCalled()
            expect(element.execute).not.toHaveBeenCalled()
        })

        it('shadow$ still asks the classic shadow root endpoint first', async () => {
            const { browser, element } = setup()
            browser.getElementShadowRoot.mockRejectedValue(new Error('x'))
            await shadow$.call(element, 'input')
            expect(browser.getElementShadowRoot).toHaveBeenCalledWith('parent-id')
        })
    })
})
