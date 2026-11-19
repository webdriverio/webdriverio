import { findElementReferences } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `$`: the first element on the screen that the selector matches.
 * mobilecli: `device.dump.ui`, the driver matches the selector.
 * @return the `no such element` error if there is none. It is not thrown,
 *         the same as in the `webdriver` package: WebdriverIO keeps it on
 *         the element and waits for the element when a command needs it.
 */
export async function findElement (session: Session, using: string, value: string) {
    const [element] = await findElementReferences(session, using, value)
    return element || {
        error: 'no such element',
        message: `No element on the screen matches the selector "${value}" (${using})`,
        stacktrace: ''
    }
}
