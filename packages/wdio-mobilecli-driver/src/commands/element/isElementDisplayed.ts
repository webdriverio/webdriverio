import { getNode } from '../../screen.js'
import { isNodeVisible } from '../../tree.js'
import type { Session } from '../../types.js'

/**
 * `isDisplayed()`, and with it `waitForDisplayed()` and `toBeDisplayed()`:
 * the element is visible now. It does not wait, and an element that is not
 * on the screen is not displayed.
 * Mobilewright: `locator.isVisible()`, and `waitFor()` with the state
 * `visible` or `hidden`. mobilecli: `device.dump.ui`
 */
export async function isElementDisplayed (session: Session, elementId: string) {
    const node = await getNode(session, elementId)
    return node !== null && isNodeVisible(node)
}
