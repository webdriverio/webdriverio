import { act, focusForFill, getNode } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `clearValue()`: wait until the element is visible, enabled and not
 * moving, tap it for the focus if it does not have it, empty the field
 * that has the focus, and check that the field is empty.
 * Mobilewright: `locator.clear()`. mobilecli: `device.io.fill` with no text
 */
export async function elementClear (session: Session, elementId: string) {
    await focusForFill(session, elementId)
    await act(session, 'device.io.fill', { text: '' })

    /**
     * the same check as in Mobilewright: a clear that leaves text behind
     * fails here, and not later in the test with a wrong value
     */
    const value = (await getNode(session, elementId))?.value ?? ''
    if (value !== '') {
        const { using, value: selector } = session.elements.getQuery(elementId)
        throw new Error(`Failed to clear the element with the selector "${selector}" (${using}): it still has the value "${value}"`)
    }
    return null
}
