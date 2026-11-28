import { act } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `hideKeyboard()`: close the on-screen keyboard. mobilecli decides how,
 * the strategies of the Appium command are not used. Nothing happens if no
 * keyboard is open, and mobilecli fails if the keyboard stays open. It may
 * take `keyboardTimeout` (60 s, as in Mobilewright), not the timeout of
 * other calls to mobilecli.
 * Mobilewright: `screen.keyboard.hide()`. mobilecli: `device.io.keyboard.hide`
 */
export async function hideKeyboard (session: Session) {
    await act(session, 'device.io.keyboard.hide', {}, session.settings.keyboardTimeout)
    return null
}
