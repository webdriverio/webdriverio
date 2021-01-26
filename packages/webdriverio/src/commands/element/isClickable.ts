import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'
import isElementClickableScript from '../../scripts/isElementClickable'

/**
 *
 * Return true if the selected DOM-element:
 *
 * - exists
 * - is visible
 * - is within viewport (if not try scroll to it)
 * - its center is not overlapped with another element
 * - is not disabled
 *
 * otherwise return false.
 *
 * :::info
 *
 * Please note that `isClickable` works only in web browser and in mobile webviews, it doesn't work in mobile app native context.
 *
 * :::
 *
 * <example>
    :isClickable.js
    it('should detect if an element is clickable', () => {
        const el = $('#el')
        let clickable = el.isClickable();
        console.log(clickable); // outputs: true or false

        // wait for element to be clickable
        browser.waitUntil(() => el.isClickable())
    });
 * </example>
 *
 * @alias element.isClickable
 * @return {Boolean}            true if element is clickable
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */
export default async function isClickable (this: WebdriverIO.Element) {
    if (!await this.isDisplayed()) {
        return false
    }

    const browser = getBrowserObject(this)
    return browser.execute(isElementClickableScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    })
}
