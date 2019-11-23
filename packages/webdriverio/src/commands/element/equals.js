
/**
 *
 * Return true if the selected DOM-element matches with the provided one.
 *
 * Please note that `equals` works only in web and webviews, it doesn't work in mobile app native context.
 *
 * <example>
    :equals.js
    it('should detect if an element is clickable', () => {
        const el = $('#el')
        const sameEl = $('#el')
        const anotherEl = $('#anotherEl')

        el.equals(sameEl) // outputs: true

        el.equals(anotherEl) // outputs: false
    });
 * </example>
 *
 * @alias element.equals
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

export default async function equals (el) {
    return getBrowserObject(this).execute(
        /* istanbul ignore next */
        (el1, el2) => el1 === el2,
        getWebElement(this), getWebElement(el))
}
