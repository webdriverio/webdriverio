/**
 *
 * Releases the mouse button previously held (where the mouse is currently at). Must
 * be called once for every buttondown command issued. See the note in click and
 * buttondown about implications of out-of-order commands.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidbuttonup
 * @type protocol
 * @deprecated
 *
 */

import handleMouseButtonProtocol from '../helpers/handleMouseButtonProtocol'
import deprecate from '../helpers/deprecationWarning'

export default function buttonUp (button) {
    deprecate('buttonUp', this.options)
    return handleMouseButtonProtocol.call(
        this,
        '/session/:sessionId/buttonup',
        button
    )
}
