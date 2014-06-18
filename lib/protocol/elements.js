/**
 *
 * Search for multiple elements on the page, starting from the document root. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/elements
 * @type protocol
 *
 */

module.exports = function elements () {
    var findStrategy = require('../helpers/find-element-strategy.js');

    var found = findStrategy(arguments);

    this.requestHandler.create(
        '/session/:sessionId/elements',
        { using: found.using, value: found.value },
        found.callback
    );
};