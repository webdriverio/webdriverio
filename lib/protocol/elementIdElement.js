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

let elementIdElement = function (id, selector) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdElement protocol command')
    }

    let found = findStrategy(selector, true)
    return this.requestHandler.create(`/session/:sessionId/element/${id}/element`, {
        using: found.using,
        value: found.value
    }).then((result) => {
        result.selector = selector
        return result
    }, (e) => {
        let result = e.seleniumStack

        /**
         * if error is not NoSuchElement throw it
         */
        if (!result || result.type !== 'NoSuchElement') {
            throw e
        }

        result.state = 'failure'
        result.sessionId = this.requestHandler.sessionID
        result.value = null
        result.selector = selector
        delete result.orgStatusMessage
        return result
    })
}

export default elementIdElement
