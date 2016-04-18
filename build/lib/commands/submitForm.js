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
    browser.submitForm('#loginForm');
 * </example>
 *
 * @param {String} selector form element
 *
 * @uses protocol/element, protocol/submit
 * @type action
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var submitForm = function submitForm(selector) {
    var _this = this;

    return this.element(selector).then(function (res) {
        return _this.submit(res.value.ELEMENT);
    });
};

exports["default"] = submitForm;
module.exports = exports["default"];
