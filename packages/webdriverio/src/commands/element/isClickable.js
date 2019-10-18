
/**
 *
 * Return true if the selected DOM-element:
 *
 * - exists;
 * - visible;
 * - is within viewport (if not try scroll to it);
 * - it's center is not overlapped with another element.
 *
 * otherwise return false.
 *
 * Please note that `isClickable` works only in web and webviews, it doesn't work in mobile app native context.
 *
 * <example>
    :isClickable.js
    it('should detect if an element is clickable', () => {
        let clickable = $('#el').isClickable();
        console.log(clickable); // outputs: true or flase
    });
 * </example>
 *
 * @alias element.isClickable
 * @return {Boolean}            true if element is clickable
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */

import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'
import isElementClickableScript from '../../scripts/isElementClickable'

export default async function isClickable () {
    if (!await this.isDisplayed()) {
        return false
    }

    return getBrowserObject(this).execute(isElementClickableScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    })
}
