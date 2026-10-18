import { describe, it, expect, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { FOREIGN_ELEMENT_ENDPOINTS, withKnownElement } from '../../src/utils/foreignContext.js'
import { isStaleElementToFindAgain } from '../../src/utils/index.js'

type Endpoint = (held: WebdriverIO.BrowsingContext, elementId: string, ...args: unknown[]) => Promise<unknown>

/**
 * A document that is the active document of its window
 */
const activeDocument = () => {
    const doc: { defaultView?: { document: unknown } } = {}
    doc.defaultView = { document: doc }
    return doc
}
const connected = { isConnected: true, ownerDocument: activeDocument(), tagName: 'LI' }
const detached = { isConnected: false, ownerDocument: activeDocument(), tagName: 'LI' }
const inactive = { isConnected: true, ownerDocument: { defaultView: null }, tagName: 'LI' }
/**
 * Firefox, after a reload: the old document has the new window
 */
const replaced = { isConnected: true, ownerDocument: { defaultView: { document: {} } }, tagName: 'LI' }

/**
 * A held frame whose `execute` runs the script on `element`
 */
function heldFrame (element: object) {
    const browser = {
        capabilities: { browserName: 'chrome' },
        emit: vi.fn(),
        browsingContextLocateNodes: vi.fn().mockResolvedValue({ nodes: [] }),
        browsingContextCaptureScreenshot: vi.fn(),
        inputPerformActions: vi.fn(),
        inputReleaseActions: vi.fn(),
        inputSetFiles: vi.fn()
    }
    const execute = vi.fn((script: (...args: unknown[]) => unknown, ...args: unknown[]) => {
        const resolved = args.map((arg) => arg && typeof arg === 'object' && ELEMENT_KEY in arg ? element : arg)
        return Promise.resolve().then(() => script(...resolved))
    })
    return { held: { isFrame: true, contextId: 'frame-1', browser, execute } as unknown as WebdriverIO.BrowsingContext, browser }
}

const commands: [string, unknown[]][] = [
    ['findElementFromElement', ['css selector', 'li']],
    ['findElementsFromElement', ['css selector', 'li']],
    ['findElementsFromElement', ['xpath', './li']],
    ['findElementsFromElement', ['link text', 'Done']],
    ['isElementSelected', []],
    ['isElementEnabled', []],
    ['getElementAttribute', ['id']],
    ['getElementProperty', ['textContent']],
    ['getElementCSSValue', ['color']],
    ['getElementText', []],
    ['getElementTagName', []],
    ['getElementRect', []],
    ['elementClick', []],
    ['elementClear', []],
    ['elementSendKeys', ['typed']],
    ['takeElementScreenshot', []]
]

describe('FOREIGN_ELEMENT_ENDPOINTS', () => {
    /**
     * W3C "get a known element": BiDi still resolves these elements
     */
    describe.each([
        ['a detached element', detached],
        ['an element of a document that is no longer active', inactive],
        ['an element of a document that a reload replaced', replaced]
    ])('for %s', (_name, element) => {
        it.each(commands)('%s throws a stale element error (%j)', async (command, args) => {
            const { held, browser } = heldFrame(element)
            const endpoint = FOREIGN_ELEMENT_ENDPOINTS[command] as unknown as Endpoint
            const err = await endpoint(held, 'element-1', ...args).catch((e: Error) => e)
            expect(isStaleElementToFindAgain(err)).toBe(true)
            expect(browser.browsingContextLocateNodes).not.toHaveBeenCalled()
            expect(browser.inputPerformActions).not.toHaveBeenCalled()
            expect(browser.browsingContextCaptureScreenshot).not.toHaveBeenCalled()
        })
    })

    it('runs the command for a connected element', async () => {
        const { held } = heldFrame(connected)
        await expect(FOREIGN_ELEMENT_ENDPOINTS.getElementTagName(held, 'element-1')).resolves.toBe('li')
    })

    it('finds elements from a connected element with browsingContext.locateNodes', async () => {
        const { held, browser } = heldFrame(connected)
        browser.browsingContextLocateNodes.mockResolvedValue({ nodes: [{ sharedId: 'child-1' }] })
        await expect(FOREIGN_ELEMENT_ENDPOINTS.findElementsFromElement(held, 'element-1', 'css selector' as never, 'li' as never))
            .resolves.toEqual([{ [ELEMENT_KEY]: 'child-1' }])
        expect(browser.browsingContextLocateNodes).toHaveBeenCalledWith({
            context: 'frame-1',
            locator: { type: 'css', value: 'li' },
            startNodes: [{ sharedId: 'element-1' }]
        })
    })
})

describe('withKnownElement', () => {
    it('keeps an async script async', () => {
        expect(withKnownElement(async () => null).constructor.name).toBe('AsyncFunction')
        expect(withKnownElement(() => null).constructor.name).toBe('Function')
    })

    it('checks the element at the given argument index', () => {
        const script = withKnownElement((_a: unknown, el: { tagName: string }) => el.tagName, 1)
        expect(script(detached, connected)).toBe('LI')
        expect(() => script(connected, detached)).toThrow('stale element reference')
    })
})
