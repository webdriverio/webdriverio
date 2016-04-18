/**
 *
 * Double-click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" ondblclick="document.getElementById('someText').innerHTML='I was dblclicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :doubleClickAsync.js
    client
        .doubleClick('#myButton')
        .getText('#someText').then(function(value) {
            assert(value === 'I was dblclicked'); // true
        });

    :doubleClickSync.js
    it('should demonstrate the doubleClick command', function () {
        browser.doubleClick('#myButton');

        var value = browser.getText('#someText');
        assert(value === 'I was dblclicked'); // true
    });
 * </example>
 *
 * @param {String} selector element to double click on. If it matches with more than on DOM-element it automatically clicks on the first element
 *
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var doubleClick = function doubleClick(selector) {
    var _this = this;

    if (this.isMobile) {
        return this.element(selector).then(function (res) {
            return _this.touchDoubleClick(res.value.ELEMENT);
        });
    }

    return this.element(selector).then(function (res) {
        return _this.moveTo(res.value.ELEMENT);
    }).doDoubleClick();
};

exports["default"] = doubleClick;
module.exports = exports["default"];
