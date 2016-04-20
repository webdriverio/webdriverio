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
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidelements
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import findStrategy from '../helpers/findElementStrategy'

let elementIdElements = function (id, selector) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdElements protocol command')
    }

    let found = findStrategy(selector, true)
    return this.requestHandler.create(`/session/:sessionId/element/${id}/elements`, {
        using: found.using,
        value: found.value
    })
}

export default elementIdElements
