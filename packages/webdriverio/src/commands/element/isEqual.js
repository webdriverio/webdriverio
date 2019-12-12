/**
 *
 * Return true if the selected element matches with the provided one.
 *
 * <example>
    :isEqual.js
    it('should detect if an element is clickable', () => {
        const el = $('#el')
        const sameEl = $('#el')
        const anotherEl = $('#anotherEl')

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

import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'

const getWebElement = (el) => ({
    [ELEMENT_KEY]: el.elementId, // w3c compatible
    ELEMENT: el.elementId // jsonwp compatible
})

export default async function isEqual (el) {
    const browser = getBrowserObject(this)

    // mobile native
    if (browser.isMobile) {
        const context = await browser.getContext()
        if (context.toLowerCase().includes('native')) {
            return this.elementId === el.elementId
        }
    }

    // browser or webview
    let result
    try {
        result = await browser.execute(
            /* istanbul ignore next */
            (el1, el2) => el1 === el2,
            getWebElement(this), getWebElement(el))
    } catch (err) {
        result = false
    }

    return result
}
