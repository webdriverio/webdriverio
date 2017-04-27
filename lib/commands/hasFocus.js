/**
 *
 * Return true or false if the selected DOM-element currently has focus. If the selector matches
 * multiple elements, it will return true if one of the elements has focus.
 *
 * <example>
    :index.html
    <input name="login" autofocus="" />

    :hasFocus.js
    it('should detect the focus of an element', function () {
        browser.url('/');

        var loginInput = $('[name="login"]');
        console.log(loginInput.hasFocus()); // outputs: false

        loginInput.click();
        console.log(loginInput.hasFocus()); // outputs: true
    })
 * </example>
 *
 * @alias browser.hasFocus
 * @param {String} selector   selector for element(s) to test for focus
 * @return {Boolean}         true if one of the matching elements has focus
 * @uses protocol/execute protocol/elements
 * @type state
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let hasFocus = function (selector) {
    return this.unify(this.elements(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value || !res.value.length) {
            throw new RuntimeError(7)
        }

        return res.value
    }).then((elements) => {
        return this.execute(function (elemArray) {
            var focused = document.activeElement
            if (!focused) {
                return false
            }

            return elemArray
                .filter((elem) => focused === elem)
                .length > 0
        }, elements)
    }), {
        extractValue: true
    })
}

export default hasFocus
