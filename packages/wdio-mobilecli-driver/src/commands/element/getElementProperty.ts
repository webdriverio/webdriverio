import { PACKAGE_NAME } from '../../constants.js'
import { waitForVisible } from '../../screen.js'
import { getNodeValue } from '../../tree.js'
import type { Session } from '../../types.js'

/**
 * `getValue()`: WebdriverIO asks for the property `value`. A native element
 * has no other properties. It waits until the element is visible.
 * Mobilewright: `locator.getValue()`. mobilecli: `device.dump.ui`
 */
export async function getElementProperty (session: Session, elementId: string, name: string) {
    if (name !== 'value') {
        throw new Error(`The property "${name}" is not supported by ${PACKAGE_NAME}, only "value" is.`)
    }
    return getNodeValue(await waitForVisible(session, elementId))
}
