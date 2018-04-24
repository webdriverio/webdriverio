
/**
 *
 * Return true if the selected DOM-element found by given selector is visible and within the viewport.
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isVisibleWithinViewport.js
    :isVisible.js
    it('should detect if an element is visible', function () {
        let isVisibleWithinViewport = browser.isVisibleWithinViewport('#notDisplayed');
        console.log(isVisibleWithinViewport); // outputs: false
        isVisibleWithinViewport = browser.isVisibleWithinViewport('#notVisible');
        console.log(isVisibleWithinViewport); // outputs: false
        isVisibleWithinViewport = browser.isVisibleWithinViewport('#notExisting');
        console.log(isVisibleWithinViewport); // outputs: false
        isVisibleWithinViewport = browser.isVisibleWithinViewport('#notInViewport');
        console.log(isVisibleWithinViewport); // outputs: false
        isVisibleWithinViewport = browser.isVisibleWithinViewport('#zeroOpacity');
        console.log(isVisibleWithinViewport); // outputs: false
    });
 * </example>
 *
 * @alias browser.isVisibleWithinViewport
 * @param   {String}             selector  DOM-element
 * @return {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */

import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'
import isDisplayedInViewportScript from '../../scripts/isDisplayedInViewport'

export default function isDisplayedInViewport () {
    return getBrowserObject(this).execute(isDisplayedInViewportScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    })
}
