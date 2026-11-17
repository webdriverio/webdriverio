import { waitForVisible } from '../../screen.js'
import { getNodeText } from '../../tree.js'
import type { Session } from '../../types.js'

/**
 * `getText()`: the text of the element, else its label, else its value. It waits
 * until the element is visible.
 * Mobilewright: `locator.getText()`. mobilecli: `device.dump.ui`
 */
export async function getElementText (session: Session, elementId: string) {
    return getNodeText(await waitForVisible(session, elementId))
}
