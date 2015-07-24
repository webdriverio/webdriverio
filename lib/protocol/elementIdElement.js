/**
 *
 * Search for an element on the page, starting from an element.
 * The located element will be returned as a WebElement JSON object.
 * The table below lists the locator strategies that each server should support.
 * Each locator must return the first matching element located in the DOM.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @param {String} selector selector to query the element
 * @returns {String} A WebElement JSON object for the located element.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/element
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js'),
    findStrategy = require('../helpers/find-element-strategy.js');

module.exports = function elementIdElement (id, string) {

    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdElement protocol command');
    }
    var found = findStrategy(string, true),
        requestPath = '/session/:sessionId/element/:id/element';

    requestPath = requestPath.replace(/:id/gi, id);

    return this.requestHandler.create(
        requestPath,
        { using: found.using, value: found.value }
    );
};
