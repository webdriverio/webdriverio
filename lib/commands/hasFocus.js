/**
 *
 * Return true or false if the selected DOM-element currently has focus.
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
 * @param {String} selector   select active element
 * @return {Boolean}         true if element has focus
 * @uses protocol/execute
 * @type state
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let hasFocus = function (selector) {
    let result = this.elements(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return res.value
    }).then((elements) => {
        return this.execute(function (selectorArray) {
            var focused = document.activeElement
            if (!focused) {
                return false
            }

            var instanceOfSelectorHasFocus = false
            for (var i = 0; i < selectorArray.length; i++) {
                if (focused === selectorArray[i]) {
                    instanceOfSelectorHasFocus = true
                }
            }
            return instanceOfSelectorHasFocus
        }, elements)
    })

    return result.then((result) => {
        return result.value
    })
}

export default hasFocus
