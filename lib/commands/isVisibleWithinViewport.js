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

    :isVisibleWithinViewportAsync.js
    client
        .isVisibleWithinViewport('#notDisplayed').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisibleWithinViewport('#notVisible').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisible('#notExisting').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisibleWithinViewport('#notInViewport').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        })
        .isVisibleWithinViewport('#zeroOpacity').then(function(isVisible) {
            console.log(isVisible); // outputs: false
        });
 * </example>
 *
 * @alias browser.isVisibleWithinViewport
 * @param   {String}             selector  DOM-element
 * @returns {Boolean|Boolean[]}            true if element(s)* [is|are] visible
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */

import isVisibleWithinViewportFunc from '../scripts/isWithinViewport'

module.exports = function isVisibleWithinViewport (selector) {
    return this.selectorExecute(selector, isVisibleWithinViewportFunc).then((res) => {
        if (Array.isArray(res) && res.length === 1) {
            return res[0]
        }

        return res
    }, (err) => {
        /**
         * if element does not exist it is automatically not visible :-)
         */
        if (err.message.indexOf('NoSuchElement') > -1) {
            return true
        }

        throw err
    })
}
