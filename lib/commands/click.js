/**
 *
 * Click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :clickAsync.js
    client
        .click('#myButton')
        .getText('#someText').then(function(value) {
            assert(value === 'I was clicked'); // true
        });

    :clickSync.js
    it('should demonstrate the click command', function () {
        browser.click('#myButton');

        var text = browser.getText('#someText');
        assert(text === 'I was clicked'); // true
    });
 * </example>
 *
 * @alias browser.click
 * @param {String} selector element to click on. If it matches with more than one DOM-element it automatically clicks on the first element
 * @uses protocol/element, protocol/elementIdClick
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let click = function (selector) {
    return this.element(selector).then((elem) => {
        /**
         * check if element was found and throw error if not
         */
        if (!elem.value) {
            throw new RuntimeError(7)
        }

        return this.elementIdClick(elem.value.ELEMENT)
    })
}

export default click
