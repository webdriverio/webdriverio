/**
 *
 * Click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :click.js
    client
        .click('#myButton')
        .getText('#someText').then(function(value) {
            assert(value === 'I was clicked'); // true
        });
 * </example>
 *
 * @param {String} selector element to click on. If it matches with more than one DOM-element it automatically clicks on the first element
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/touchClick
 * @type action
 *
 */

module.exports = function click (selector) {
    var clickMethod = this.isMobile ? 'touchClick' : 'elementIdClick';
    return this.element(selector).then(function(elem) {
        return this[clickMethod](elem.value.ELEMENT);
    });
};
