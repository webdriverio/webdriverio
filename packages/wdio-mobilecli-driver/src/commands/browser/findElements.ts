import { findElementReferences } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `$$`: all elements on the screen that the selector matches.
 * mobilecli: `device.dump.ui`, the driver matches the selector.
 */
export async function findElements (session: Session, using: string, value: string) {
    return findElementReferences(session, using, value)
}
