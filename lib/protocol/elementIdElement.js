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
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidelement
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import findStrategy from '../helpers/findElementStrategy'

let elementIdElement = function (id, string) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdElement protocol command')
    }

    let found = findStrategy(string, true)
    return this.requestHandler.create(`/session/:sessionId/element/${id}/element`, {
        using: found.using,
        value: found.value
    })
}

export default elementIdElement
