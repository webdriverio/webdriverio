/**
 *
 * Search for multiple elements on the page, starting from the document root. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 * @callbackParameter error, response
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/elements
 * @type protocol
 *
 */

var findStrategy = require('../helpers/find-element-strategy.js');

module.exports = function elements(selector) {

    var found = findStrategy(selector),
        requestPath = '/session/:sessionId/elements',
        lastPromise = this.lastPromise.inspect();

    if(lastPromise.state === 'fulfilled' && lastPromise.value && lastPromise.value.value && lastPromise.value.value.ELEMENT) {
        var elem = lastPromise.value.value.ELEMENT;
        requestPath = '/session/:sessionId/element/' + elem + '/elements'
    }

    return this.requestHandler.create(
        requestPath,
        { using: found.using, value: found.value }
    );
};