import { describe, it, expect, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { findElement, isStaleElementError, elementPromiseHandler } from '../../src/utils/index.js'

vi.mock('is-plain-obj', () => ({
    default: vi.fn().mockReturnValue(false)
}))

describe('findElement', () => {
    it('should find element using JS function', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            elementId: 'source-elem',
            execute: vi.fn().mockReturnValue(elemRes)
        }
        expect(await findElement.call(browser, () => 'testme' as any as HTMLElement)).toEqual(elemRes)
        expect(browser.execute).toBeCalledWith(expect.any(String), browser)
    })

    it('should find element using JS function with referenceId', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            elementId: 'source-elem',
            execute: vi.fn().mockResolvedValue(elemRes)
        }
        const domNode = { nodeType: 1, nodeName: 'DivElement' } as HTMLElement
        // @ts-expect-error
        globalThis.window = {}
        expect(await findElement.call(browser, domNode)).toEqual(elemRes)
        expect(browser.execute).toBeCalledWith(
            expect.any(String),
            browser,
            expect.any(String)
        )
    })

    it('should not find element using JS function with referenceId', async () => {
        const browser: any = {
            elementId: 'source-elem',
            execute: vi.fn().mockRejectedValue(new Error('stale element reference: element is not attached to the page document'))
        }
        const domNode = { nodeType: 1, nodeName: 'DivElement' } as HTMLElement
        // @ts-expect-error
        globalThis.window = {}
        expect(await findElement.call(browser, domNode)).toEqual(
            expect.objectContaining({ message: 'DOM Node couldn\'t be found anymore' })
        )
        expect(browser.execute).toBeCalledWith(
            expect.any(String),
            browser,
            expect.any(String)
        )
    })
})

describe('elementPromiseHandler', () => {
    it('should handle error', () => {
        const shadowRootManager: any = {
            deleteShadowRoot: vi.fn()
        }
        const handler = elementPromiseHandler('foobar', shadowRootManager)
        expect(handler(new Error('foobar'))).toBe(undefined)
        expect(handler({ error: 'foobar' })).toBe(undefined)
        expect(handler({ message: 'foobar' })).toBe(undefined)
    })

    it('should handle element', () => {
        const shadowRootManager: any = {
            deleteShadowRoot: vi.fn()
        }
        const handler = elementPromiseHandler('foobar', shadowRootManager)
        const elem = { foo: 'bar' }
        expect(handler(elem)).toEqual(elem)
        expect(shadowRootManager.deleteShadowRoot).toBeCalledTimes(0)
    })

    it('should handle element with shadow root', () => {
        const shadowRootManager: any = {
            deleteShadowRoot: vi.fn()
        }
        const handler = elementPromiseHandler('foobar', shadowRootManager, 'shadow-root-id')
        const elem = { foo: 'bar' }
        expect(handler(elem)).toEqual(elem)
        expect(shadowRootManager.deleteShadowRoot).toBeCalledTimes(0)
    })

    it('should handle stale element error', () => {
        const shadowRootManager: any = {
            deleteShadowRoot: vi.fn()
        }
        const handler = elementPromiseHandler('foobar', shadowRootManager, 'shadow-root-id')
        const error = new Error('stale element reference: element is not attached to the page document')
        expect(handler(error)).toBe(undefined)
        expect(shadowRootManager.deleteShadowRoot).toBeCalledTimes(0)
    })

    it('should handle detached shadow root error', () => {
        const shadowRootManager: any = {
            deleteShadowRoot: vi.fn()
        }
        const handler = elementPromiseHandler('foobar', shadowRootManager, 'shadow-root-id')
        const error = new Error('detached shadow root')
        expect(handler(error)).toBe(undefined)
        expect(shadowRootManager.deleteShadowRoot).toBeCalledWith('shadow-root-id', 'foobar')
    })
})

it('isStaleElementError', () => {
    const staleElementChromeError = new Error('stale element reference: element is not attached to the page document')
    expect(isStaleElementError(staleElementChromeError)).toBe(true)
    const staleElementFirefoxError = new Error('The element <nested-component> is no longer attached to the DOM')
    expect(isStaleElementError(staleElementFirefoxError)).toBe(true)
    const staleElementSafariError = new Error('A node reference could not be resolved: Stale element found when trying to create the node handle')
    expect(isStaleElementError(staleElementSafariError)).toBe(true)
    const staleElementJSError = new Error('javascript error: {"status":10,"value":"stale element not found in the current frame"}')
    expect(isStaleElementError(staleElementJSError)).toBe(true)
    const otherError = new Error('something else')
    expect(isStaleElementError(otherError)).toBe(false)
})
