import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject } from '../../utils/index.js'
import isElementClickableScript from '../../scripts/isElementClickable.js'

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
 * Please note that `isClickable` works only in web browser and in mobile webviews,
 * it doesn't work in mobile app native context. Also, As opposed to other element
 * commands WebdriverIO will not wait for the element to exist to execute this command.
 *
 * :::
 *
 * <example>
    :isClickable.js
    it('should detect if an element is clickable', async () => {
        const el = await $('#el')
        let clickable = await el.isClickable();
        console.log(clickable); // outputs: true or false

        // wait for element to be clickable
        await browser.waitUntil(() => el.isClickable())
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
    } as any as HTMLElement)
}
