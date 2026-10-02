import { describe, it, expect, vi } from 'vitest'
import { ELEMENT_KEY, type local } from 'webdriver'

import {
    findElement,
    findElements,
    isStaleElementError,
    elementPromiseHandler,
    transformClassicToBidiSelector,
    createFunctionDeclarationFromString
} from '../../src/utils/index.js'

vi.mock('is-plain-obj', () => ({
    default: vi.fn().mockReturnValue(false)
}))

describe('findElement', () => {
    it('should find element using JS function', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            on: vi.fn(),
            elementId: 'source-elem',
            executeScript: vi.fn().mockReturnValue(elemRes)
        }
        expect(await findElement.call(browser, () => 'testme' as unknown as HTMLElement)).toEqual(elemRes)
        expect(browser.executeScript).toBeCalledWith(expect.any(String), [browser])
    })

    it('should find element using JS function with referenceId', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            on: vi.fn(),
            elementId: 'source-elem',
            executeScript: vi.fn().mockResolvedValue(elemRes)
        }
        const domNode = { nodeType: 1, nodeName: 'DivElement' } as HTMLElement
        // @ts-expect-error
        globalThis.window = {}
        expect(await findElement.call(browser, domNode)).toEqual(elemRes)
        expect(browser.executeScript).toBeCalledWith(
            expect.any(String),
            [
                browser,
                expect.any(String)
            ]
        )
    })

    it('should not find element using JS function with referenceId', async () => {
        const browser: any = {
            on: vi.fn(),
            elementId: 'source-elem',
            executeScript: vi.fn().mockRejectedValue(new Error('stale element reference: element is not attached to the page document'))
        }
        const domNode = { nodeType: 1, nodeName: 'DivElement' } as HTMLElement
        // @ts-expect-error
        globalThis.window = {}
        expect(await findElement.call(browser, domNode)).toEqual(
            expect.objectContaining({ message: 'DOM Node couldn\'t be found anymore' })
        )
        expect(browser.executeScript).toBeCalledWith(
            expect.any(String),
            [
                browser,
                expect.any(String)
            ]
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
    const staleElementBidiError = new Error('belongs to different document. Current document is')
    expect(isStaleElementError(staleElementBidiError)).toBe(true)
    const otherError = new Error('something else')
    expect(isStaleElementError(otherError)).toBe(false)
})

describe('transformClassicToBidiSelector', () => {
    it('transforms classic css selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('css selector', '.red')
        expect(bidiSelector.type).toBe('css')
        expect(bidiSelector.value).toBe('.red')
    })

    it('transforms classic tag name selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('tag name', 'div')
        expect(bidiSelector.type).toBe('css')
        expect(bidiSelector.value).toBe('div')
    })

    it('transforms classic xpath selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('xpath', '//html/body/section/div[6]/div/span')
        expect(bidiSelector.type).toBe('xpath')
        expect(bidiSelector.value).toBe('//html/body/section/div[6]/div/span')
    })

    it('transforms classic link text selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('link text', 'GitHub Repo')
        expect(bidiSelector.type).toBe('innerText')
        expect(bidiSelector.value).toBe('GitHub Repo')
    })

    it('transforms classic partial link text selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('partial link text', 'new')
        expect(bidiSelector.type).toBe('innerText')
        expect(bidiSelector.value).toBe('new')
        expect((bidiSelector as local.BrowsingContextInnerTextLocator).matchType).toBe('partial')
    })

    it('transforms aria selector to BiDi accessibility locator', () => {
        const bidiSelector = transformClassicToBidiSelector('aria', 'Submit')
        expect(bidiSelector.type).toBe('accessibility')
        expect(bidiSelector.value).toEqual({ name: 'Submit' })
    })

    it('transforms a role selector to a BiDi accessibility locator with role and name', () => {
        expect(transformClassicToBidiSelector('role', '{"role":"button","name":"Add to cart"}'))
            .toEqual({ type: 'accessibility', value: { role: 'button', name: 'Add to cart' } })
        expect(transformClassicToBidiSelector('role', '{"role":"row"}'))
            .toEqual({ type: 'accessibility', value: { role: 'row' } })
        expect(transformClassicToBidiSelector('role', '{"role":"img","name":""}'))
            .toEqual({ type: 'accessibility', value: { role: 'img', name: '' } })
    })
})

describe('role selector on a Classic session', () => {
    function classicBrowser (result: unknown) {
        const browser: any = {
            on: vi.fn(),
            isBidi: false,
            isMobile: false,
            execute: vi.fn().mockResolvedValue(result),
            findElement: vi.fn(),
            findElements: vi.fn()
        }
        return browser
    }

    it('finds the first element by role and name in the page', async () => {
        const browser = classicBrowser([{ [ELEMENT_KEY]: 'el-1' }, { [ELEMENT_KEY]: 'el-2' }])
        expect(await findElement.call(browser, 'role/button[name="Add to cart"]')).toEqual({ [ELEMENT_KEY]: 'el-1' })
        expect(browser.execute).toHaveBeenCalledWith(expect.any(Function), expect.any(Array), 'button', 'Add to cart', -1, null)
        expect(browser.findElement).not.toHaveBeenCalled()
    })

    it('returns every match and passes a null name for a role-only selector', async () => {
        const browser = classicBrowser([{ [ELEMENT_KEY]: 'el-1' }, { [ELEMENT_KEY]: 'el-2' }])
        expect(await findElements.call(browser, 'role/row')).toEqual([{ [ELEMENT_KEY]: 'el-1' }, { [ELEMENT_KEY]: 'el-2' }])
        expect(browser.execute).toHaveBeenCalledWith(expect.any(Function), expect.any(Array), 'row', null, -1, null)
        expect(browser.findElements).not.toHaveBeenCalled()
    })

    it('searches within the element a selector is chained from', async () => {
        const browser = classicBrowser([{ [ELEMENT_KEY]: 'pay' }])
        const dialog = { elementId: 'dialog-1', [ELEMENT_KEY]: 'dialog-1', parent: browser, ...browser }
        dialog.execute = browser.execute
        await findElements.call(dialog, 'role/button[name="Pay now"]')
        expect(browser.execute).toHaveBeenCalledWith(expect.any(Function), expect.any(Array), 'button', 'Pay now', -1, dialog)
    })

    it('returns a not-found error when nothing matches', async () => {
        const browser = classicBrowser([])
        const result = await findElement.call(browser, 'role/button[name="Missing"]')
        expect(result).toBeInstanceOf(Error)
        expect((result as Error).message).toBe('Couldn\'t find element with selector "role/button[name="Missing"]"')
    })

    it('rejects the selector in a native app context', async () => {
        const browser = classicBrowser([])
        browser.isMobile = true
        browser.isNativeContext = Promise.resolve(true)
        await expect(findElements.call(browser, 'role/button')).rejects.toThrow('is not supported in a native app context')
        expect(browser.execute).not.toHaveBeenCalled()
    })
})

describe('createFunctionDeclarationFromString', () => {
    it('should return a wrapped function string', () => {
        expect(createFunctionDeclarationFromString((a: string, b: string, c: string) => console.log('foobar' + a + b + c))).toMatchInlineSnapshot(`
          "function anonymous(
          ) {
          return (/* __wdio script__ */(a, b, c) => console.log("foobar" + a + b + c)/* __wdio script end__ */).apply(this, arguments);
          }"
        `)
        function namedFunction(a: string, b: string, c: string) {
            console.log('foobar' + a + b + c)
        }
        expect(createFunctionDeclarationFromString(namedFunction)).toMatchInlineSnapshot(`
          "function anonymous(
          ) {
          return (/* __wdio script__ */function namedFunction(a, b, c) {
                console.log("foobar" + a + b + c);
              }/* __wdio script end__ */).apply(this, arguments);
          }"
        `)
        expect(createFunctionDeclarationFromString('console.log("foobar")')).toMatchInlineSnapshot(`
          "(/* __wdio script__ */function () {
          console.log("foobar")
          }/* __wdio script end__ */).apply(this, arguments);"
        `)
    })
})
