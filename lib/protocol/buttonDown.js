/**
 *
 * Click and hold the left mouse button (at the coordinates set by the last moveto
 * command). Note that the next mouse-related command that should follow is buttonup.
 * Any other mouse command (such as click or another call to buttondown) will yield
 * undefined behaviour.
 *
 * This command is depcrecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidbuttondown
 * @type protocol
 *
 */

import handleMouseButtonProtocol from '../helpers/handleMouseButtonProtocol'
import depcrecate from '../helpers/depcrecationWarning'

export default function buttonDown (button) {
    depcrecate('buttonDown')
    return handleMouseButtonProtocol.call(
        this,
        '/session/:sessionId/buttondown',
        button
    )
}
