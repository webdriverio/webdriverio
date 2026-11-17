import { act, focusElement } from '../../screen.js'
import type { Session, TextOptions } from '../../types.js'

/**
 * `addValue()`: add text to what is in the field. Wait until the element
 * is visible, enabled and not moving, tap it, wait until it has the focus,
 * then type.
 * Mobilewright has no counterpart on a locator, it is `screen.keyboard`
 * typing after a tap. mobilecli: `device.io.text`
 * @param  options  the `CommandRuntimeOptions` of WebdriverIO, for
 *                  `addValue(text, { mask: true })`: the text is not logged
 */
export async function elementSendKeys (session: Session, elementId: string, text: string, options?: TextOptions) {
    await focusElement(session, elementId)
    if (text !== undefined && text !== null && String(text) !== '') {
        await act(session, 'device.io.text', { text: String(text) }, undefined, { mask: options?.mask === true })
    }
    return null
}
