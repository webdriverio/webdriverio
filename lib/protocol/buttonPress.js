/**
 *
 * Click any mouse button (at the coordinates set by the last moveto command). Note
 * that calling this command after calling buttondown and before calling button up
 * (or any out-of-order interactions sequence) will yield undefined behaviour.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @param {Number} button  Which button, enum: *{LEFT = 0, MIDDLE = 1 , RIGHT = 2}*. Defaults to the left mouse button if not specified.
 * @type protocol
 * @deprecated
 *
 */

import handleMouseButtonProtocol from '../helpers/handleMouseButtonProtocol'
import deprecate from '../helpers/deprecationWarning'

export default function buttonPress (button) {
    deprecate(
        'buttonPress',
        this.options.deprecationWarnings,
        'This command is not part of the W3C WebDriver spec and won\'t be supported in ' +
        'future versions of the driver. It is recommended to use the action command as ' +
        'a replacement for this.'
    )

    return handleMouseButtonProtocol.call(this, '/session/:sessionId/click', button)
}
