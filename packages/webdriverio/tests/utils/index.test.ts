import { describe, it, expect, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { findElement, isStaleElementError } from '../../src/utils/index.js'

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

it('isStaleElementError', () => {
    const staleElementChromeError = new Error('stale element reference: element is not attached to the page document')
    expect(isStaleElementError(staleElementChromeError)).toBe(true)
    const staleElementFirefoxError = new Error('The element <nested-component> is no longer attached to the DOM')
    expect(isStaleElementError(staleElementFirefoxError)).toBe(true)
    const staleElementSafariError = new Error('A node reference could not be resolved: Stale element found when trying to create the node handle')
    expect(isStaleElementError(staleElementSafariError)).toBe(true)
    const otherError = new Error('something else')
    expect(isStaleElementError(otherError)).toBe(false)
})
