/**
 *
 * Click any mouse button (at the coordinates set by the last moveto command). Note
 * that calling this command after calling buttondown and before calling button up
 * (or any out-of-order interactions sequence) will yield undefined behaviour.
 *
 * This command is depcrecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 * @type protocol
 *
 */

import handleMouseButtonProtocol from '../helpers/handleMouseButtonProtocol'
import depcrecate from '../helpers/depcrecationWarning'

export default function buttonPress (button) {
    depcrecate('buttonPress')
    return handleMouseButtonProtocol.call(
        this,
        '/session/:sessionId/click',
        button
    )
}
