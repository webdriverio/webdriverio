import { tapElement } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `click()` and `tap()`: mobilecli has no click, both are a tap in the
 * middle of the element. It waits until the element is visible, enabled
 * and not moving.
 * Mobilewright: `locator.tap()`. mobilecli: `device.io.tap`
 */
export async function elementClick (session: Session, elementId: string) {
    await tapElement(session, elementId)
    return null
}
