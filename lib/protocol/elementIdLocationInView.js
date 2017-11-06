/**
 *
 * Determine an element's location on the screen once it has been scrolled into view.
 *
 * *Note:* This is considered an internal command and should only be used to determine
 * an element's location for correctly generating native events.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors. Please use the
 * [`elementIdRect`](http://webdriver.io/api/protocol/elementIdRect.html) command instead.
 *
 * @param {String} ID ID of a WebElement JSON object to route the command to
 * @return {Object} The X and Y coordinates for the element (`{x:number, y:number}`)
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidlocation_in_view
 * @type protocol
 * @deprecated
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'
import deprecate from '../helpers/deprecationWarning'

export default function elementIdLocationInView (id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdLocationInView protocol command')
    }

    deprecate(
        'elementIdLocationInView',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. There is currently no known replacement for this ' +
        'action. You can use the execute command to get a custom position of an element ' +
        'using JavaScript.'
    )
    return this.requestHandler.create(`/session/:sessionId/element/${id}/location_in_view`)
}
