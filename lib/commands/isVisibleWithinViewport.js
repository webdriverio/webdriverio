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
        var isVisibleWithinViewport = browser.isVisibleWithinViewport('#notDisplayed');
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

import isVisibleWithinViewportFunc from '../scripts/isWithinViewport'

module.exports = function isVisibleWithinViewport (selector) {
    /**
     * check if we already queried the element within a prior command, in these cases
     * the selector attribute is null and the element can be recieved calling the
     * `element` command again
     */
    let resultPromise
    if (selector === null) {
        resultPromise = this.elements(selector).then(
            (res) => this.execute(isVisibleWithinViewportFunc, res.value)
        ).then((result) => result.value)
    } else {
        resultPromise = this.selectorExecute(selector, isVisibleWithinViewportFunc)
    }

    return resultPromise.then((res) => {
        if (Array.isArray(res) && res.length === 1) {
            return res[0]
        }

        return res
    }, (err) => {
        /**
         * if element does not exist it is automatically not visible :-)
         */
        if (err.message.indexOf('NoSuchElement') > -1) {
            return false
        }

        throw err
    })
}
