import { ELEMENT_KEY } from 'webdriver'

import { getBrowserObject } from '../../utils/index.js'
import isElementClickableScript from '../../scripts/isElementClickable.js'

interface IsClickableOptions {
    withinViewport?: boolean
}

/**
 *
 * An element is considered to be clickable when the following conditions are met:
 *
 * - the element exist and is displayed
 * - is not disabled
 * - the element is within the viewport
 * - the element's center is not overlapped with another element

 * If withinViewport is falsy, the command attempts to scroll the element to the center of the viewport and performs the above checks, after which it attempts to scroll back to it's original coordinates
 * If withinViewport is true, the command does not attempt to scroll the element to the center of the viewport and instead directly runs the above checks
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
    it('should detect if an element is clickable anywhere on the page', async () => {
        const el = await $('#el')
        let clickable = await el.isClickable();
        console.log(clickable); // outputs: true or false
    });
    it('should detect if an element is clickable in the viewport only', async () => {
        const el = await $('#el')
        let clickable = await el.isClickable({ withinViewport: true });
        console.log(clickable); // outputs: true or false
    });
 * </example>
 *
 * @alias element.isClickable
 * @param {IsClickableOptions=}  options waitForEnabled options (optional)
 * @param {Boolean=} options.withinViewport set to true to check if element is clickable within scrolling it into the viewport
 * @return {Boolean} true if element is clickable
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */
export async function isClickable (
    this: WebdriverIO.Element,
    options: IsClickableOptions = { withinViewport: false }
) {
    if (!await this.isDisplayed()) {
        return false
    }

    /**
     * some Appium platforms don't support the `getContext` method, in that case
     * we can't determine if we are in a native context or not, so we return undefined
     */
    if (this.isMobile && await this.getContext().catch(() => undefined) === 'NATIVE_APP') {
        throw new Error('Method not supported in mobile native environment. It is unlikely that you need to use this command.')
    }

    const browser = getBrowserObject(this)
    return browser.execute(isElementClickableScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement, options)
}
