/**
 *
 * Double-click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" ondblclick="document.getElementById('someText').innerHTML='I was dblclicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :doubleClick.js
    it('should demonstrate the doubleClick command', function () {
        var myButton = $('#myButton')
        myButton.doubleClick()
        // or
        browser.doubleClick('#myButton')

        var value = browser.getText('#someText')
        assert(value === 'I was dblclicked') // true
    })
 * </example>
 *
 * @alias browser.doubleClick
 * @param {String} selector  element to double click on. If it matches with more than on DOM-element it automatically clicks on the first element
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let doubleClick = function (selector) {
    if (this.isMobile) {
        return this.element(selector).then((res) => {
            /**
             * check if element was found and throw error if not
             */
            if (!res.value) {
                throw new RuntimeError(7)
            }

            return this.touchDoubleClick(res.value.ELEMENT)
        })
    }

    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.moveTo(res.value.ELEMENT)
    }).doDoubleClick()
}

export default doubleClick
