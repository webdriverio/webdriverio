/**
 * Search for an element on the page, starting from the document root.
 * The located element will be returned as a WebElement JSON object.
 * The table below lists the locator strategies that each server should support.
 * Each locator must return the first matching element located in the DOM.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element
 *
 * @param {String} selector selector to query the element
 * @returns {String} A WebElement JSON object for the located element.
 * @type protocol
 *
 */

var findStrategy = require('../helpers/find-element-strategy.js');

module.exports = function element() {
    var found = findStrategy(arguments);

    this.requestHandler.create(
        '/session/:sessionId/element',
        { using: found.using, value: found.value },
        found.callback
    );
};
