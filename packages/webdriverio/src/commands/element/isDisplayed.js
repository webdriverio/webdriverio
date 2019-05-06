/**
 *
 * Return true if the selected DOM-element is displayed.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isDisplayed.js
    it('should detect if an element is displayed', () => {
        let elem = $('#notDisplayed');
        let isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notVisible');

        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notExisting');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = $('#notInViewport');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: true

        elem = $('#zeroOpacity');
        isDisplayed = elem.isDisplayed();
        console.log(isDisplayed); // outputs: true
    });
 * </example>
 *
 * @alias element.isDisplayed
 * @return {Boolean} true if element is displayed
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */

import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'
import isElementDisplayedScript from '../../scripts/isElementDisplayed'

const noW3CEndpoint = ['microsoftedge', 'safari', 'chrome']

export default async function isDisplayed() {

    let browser = getBrowserObject(this)

    /*
     * This is only necessary as isDisplayed is on the exclusion list for the middleware
     */
    if (!this.elementId) {
        this.elementId = (await this.parent.$(this.selector)).elementId
    }

    /*
     * if element was still not found it also is not displayed
     */
    if (!this.elementId) {
        return false
    }

    /*
     * https://www.w3.org/TR/webdriver/#element-displayedness
     * Certain drivers have decided to remove the endpoint as the spec
     * no longer dictates it. In those instances, we pass the element through a script
     * that was provided by Brian Burg of safaridriver.
     */
    return browser.isW3C && browser.capabilities.browserName && noW3CEndpoint.includes(browser.capabilities.browserName.toLowerCase()) ?
        await browser.execute(isElementDisplayedScript, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId // jsonwp compatible
        }) :
        await this.isElementDisplayed(this.elementId)
}
