import type { Session } from '../../types.js'

/**
 * End the session. mobilecli has no session to end: the device, the app and
 * the server keep running.
 */
export async function deleteSession (session: Session) {
    session.ended = true
    session.elements.clear()
    session.lastDump = undefined
    return null
}
