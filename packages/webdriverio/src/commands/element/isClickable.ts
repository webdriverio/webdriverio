import { ELEMENT_KEY } from 'webdriver'

import { getBrowserObject } from '@wdio/utils'
import isElementClickableScript from '../../scripts/isElementClickable.js'

/**
 *
 * An element is considered to be clickable when the following conditions are met:
 *
 * - the element exists
 * - the element is displayed
 * - the element is not disabled
 * - the element is within the viewport
 * - the element can be scrolled into the viewport
 * - the element's center is not overlapped with another element
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
export async function isClickable (this: WebdriverIO.Element) {
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
    } as any as HTMLElement)
}
