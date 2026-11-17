import { act, focusForFill } from '../../screen.js'
import type { Session, TextOptions } from '../../types.js'

/**
 * `setValue()`: replace what is in the field with the text, in one call.
 * Wait until the element is visible, enabled and not moving, tap it for the
 * focus if it does not have it, then fill the field that has the focus.
 *
 * It is not a WebDriver command and not a command of the session: a test
 * can not call it. WebdriverIO sends `setValue()` as `elementClear` and
 * `elementSendKeys`, which are two calls to mobilecli and a wait for the
 * focus in between. The driver replaces `setValue()` of an element, and
 * that calls this function, see `getApiCommands`. It is logged and sent to
 * the reporters as `setElementValue`, like a command.
 * Mobilewright: `locator.fill()`. mobilecli: `device.io.fill`
 * @param  options  for `setValue(text, { mask: true })`: the text is not
 *                  logged
 */
export async function setElementValue (session: Session, elementId: string, text: string, options?: TextOptions) {
    await focusForFill(session, elementId)
    await act(session, 'device.io.fill', { text: String(text) }, undefined, { mask: options?.mask === true })
    return null
}
