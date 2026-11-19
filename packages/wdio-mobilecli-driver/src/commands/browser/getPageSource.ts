import { dumpUI } from '../../screen.js'
import type { Session } from '../../types.js'

/**
 * `getPageSource()`: the UI tree as mobilecli returns it, which is JSON and
 * not the XML of Appium.
 * mobilecli: `device.dump.ui`
 */
export async function getPageSource (session: Session) {
    return JSON.stringify(await dumpUI(session), null, 2)
}
