import { pageRecorder } from '@wdio/snapshot'
import type { Session } from '../session.js'

/**
 * Install the recorder for every page and frame the session loads from now
 * on. Needs WebDriver BiDi; without it snapshots fall back to open shadow
 * roots and `onclick` attributes.
 */
export async function installPageRecorder (session: Session) {
    if (!session.isWeb || session.applies.includes('M') || !session.isBidi || typeof session.browser.addInitScript !== 'function') {
        return
    }
    await session.browser.addInitScript(pageRecorder)
}
