import type { Session } from '../../types.js'

/**
 * `browser.getTimeouts()`: how long the commands of an element wait for it
 * now, see `setTimeouts`
 */
export async function getTimeouts (session: Session) {
    return { implicit: session.wait.timeout }
}
