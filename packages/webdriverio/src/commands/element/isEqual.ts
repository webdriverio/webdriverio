import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import type { Element } from '../../types'

const getWebElement = (el: Element) => ({
    [ELEMENT_KEY]: el.elementId, // w3c compatible
    ELEMENT: el.elementId // jsonwp compatible
})

/**
 *
 * Return true if the selected element matches with the provided one.
 *
 * <example>
    :isEqual.js
    it('should detect if an element is clickable', async () => {
        const el = await $('#el')
        const sameEl = await $('#el')
        const anotherEl = await $('#anotherEl')

        el.isEqual(sameEl) // outputs: true

        el.isEqual(anotherEl) // outputs: false
    });
 * </example>
 *
 * @alias element.isEqual
 * @param   {Element}   el element to compare with
 * @return  {Boolean}   true if elements are equal
 *
 */
export async function isEqual (
    this: Element,
    el: Element
) {
    const browser = getBrowserObject(this)

    // mobile native
    if (browser.isMobile) {
        const context = await browser.getContext()
        const contextId = typeof context === 'string'
            ? context
            : context?.id

        if (contextId && contextId.toLowerCase().includes('native')) {
            return this.elementId === el.elementId
        }
    }

    // browser or webview
    let result: boolean
    try {
        result = await browser.execute(
            /* istanbul ignore next */
            function (el1: Element, el2: Element) { return el1 === el2 },
            getWebElement(this), getWebElement(el))
    } catch (err: any) {
        result = false
    }

    return result
}
