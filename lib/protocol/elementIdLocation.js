/**
 *
 * Determine an element's location on the page. The point (0, 0) refers to the
 * upper-left corner of the page. The element's coordinates are returned as a
 * JSON object with x and y properties.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`elementIdRect`](http://webdriver.io/api/protocol/elementIdRect.html) command instead.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {Object} The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidlocation
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import { isUnknownCommand } from '../helpers/utilities'

export default function elementIdLocation (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdLocation protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/location`).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (isUnknownCommand(err)) {
            return this.elementIdRect(id).then((result) => {
                const { x, y } = result.value
                result.value = { x, y }
                return result
            })
        }

        throw err
    })
}
