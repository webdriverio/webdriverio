import { getNode } from '../../screen.js'
import { isNodeEnabled } from '../../tree.js'
import type { Session } from '../../types.js'

/**
 * `isEnabled()`, and with it `waitForEnabled()` and `toBeEnabled()`: the
 * element is enabled now. It does not wait, and an element that is not on
 * the screen is not enabled.
 * Mobilewright: `locator.isEnabled()`, and `waitFor()` with the state
 * `enabled` or `disabled`. mobilecli: `device.dump.ui`
 */
export async function isElementEnabled (session: Session, elementId: string) {
    const node = await getNode(session, elementId)
    return node !== null && isNodeEnabled(node)
}
