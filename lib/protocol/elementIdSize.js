/**
 *
 * Determine an element's size in pixels. The size will be returned as a JSON object
 * with width and height properties.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`elementIdRect`](http://webdriver.io/api/protocol/elementIdRect.html) command instead.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {Object} The width and height of the element, in pixels (`{width:number, height:number}`)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidsize
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function elementIdSize (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdSize protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/size`).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (err.message.match(/did not match a known command/)) {
            return this.elementIdRect(id).then((result) => {
                const { width, height } = result.value
                result.value = { width, height }
                return result
            })
        }

        throw err
    })
}
