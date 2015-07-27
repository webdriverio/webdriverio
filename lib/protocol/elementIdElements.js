/**
 *
 * Search for multiple elements on the page, starting from an element. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/elements
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdElements (id, selector) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdElements protocol command');
    }

    var findStrategy = require('../helpers/find-element-strategy.js');

    var found = findStrategy(selector, true);

    var requestPath = '/session/:sessionId/element/:id/elements';
    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(
        requestPath,
        { using: found.using, value: found.value }
    );
};
