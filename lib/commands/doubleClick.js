/**
 *
 * Double-click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" ondblclick="document.getElementById('someText').innerHTML='I was dblclicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :doubleClick.js
    client
        .doubleClick('#myButton')
        .getText('#someText').then(function(value) {
            assert(value === 'I was dblclicked'); // true
        });
 * </example>
 *
 * @param {String} selector element to double click on. If it matches with more than on DOM-element it automatically clicks on the first element
 * @callbackParameter error
 *
 * @uses protocol/element, protocol/moveTo, protocol/doDoubleClick, protocol/touchDoubleClick
 * @type action
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function doubleClick (selector) {

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with doubleClick command');
    }

    if(this.isMobile) {

        return this.element(selector).then(function(res) {
            return this.touchDoubleClick(res.value.ELEMENT);
        });

    }

    return this.element(selector).then(function(res) {
        return this.moveTo(res.value.ELEMENT);
    }).doDoubleClick();

};