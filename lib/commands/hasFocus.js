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
 * @returns {Boolean}         true if element has focus
 * @uses protocol/execute
 * @type state
 *
 */

let hasFocus = function (selector) {
    let result = this.execute(function (selector) {
        var focused = document.activeElement

        if (!focused || focused === document.body) {
            return false
        } else if (document.querySelector) {
            return focused === document.querySelector(selector)
        }

        return false
    }, selector)

    return result.then(result => result.value)
}

export default hasFocus
