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
import { getBrowserObject, hasElementId } from '../../utils'
import isElementDisplayedScript from '../../scripts/isElementDisplayed'

const noW3CEndpoint = ['microsoftedge', 'safari', 'chrome', 'safari technology preview']

export default async function isDisplayed() {

    let browser = getBrowserObject(this)

    if (!await hasElementId(this)) {
        return false
    }

    /*
     * https://www.w3.org/TR/webdriver/#element-displayedness
     * Certain drivers have decided to remove the endpoint as the spec
     * no longer dictates it. In those instances, we pass the element through a script
     * that was provided by Brian Burg of safaridriver.
     *
     * 6th of May 2019 APPIUM response (mykola-mokhnach) :
     * - Appium didn't enable W3C mode for mobile drivers.
     * - Safari and Chrome work in jsonwp mode and Appium just rewrites W3C requests from upstream to jsonwp if needed
     */
    return browser.isDevTools || (browser.isW3C && !browser.isMobile && noW3CEndpoint.includes(browser.capabilities.browserName.toLowerCase())) ?
        await browser.execute(isElementDisplayedScript, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId // jsonwp compatible
        }) :
        await this.isElementDisplayed(this.elementId)
}
