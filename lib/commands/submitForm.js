/**
 *
 * Submits a form found by given selector. The submit command may also be applied
 * to any element that is a descendant of a `<form>` element.
 *
 * <example>
    :index.html
    <form action="/form.php" method="post" id="loginForm">
        <label for="username">User:</label>
        <input type="text" name="username" id="username">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <input type="submit" value="Login">
    </form>

    :submitForm.js
    it('should submit login form', function () {
        browser.setValue('#username', 'foobar');
        browser.setValue('#password', 'test123');
        browser.submitForm('#loginForm');
    });
 * </example>
 *
 * @alias browser.submitForm
 * @param {String} selector form element
 * @uses protocol/element, protocol/submit
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let submitForm = function (selector) {
    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.submit(res.value.ELEMENT)
    })
}

export default submitForm
