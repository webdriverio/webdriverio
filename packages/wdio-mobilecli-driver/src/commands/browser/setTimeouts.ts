import type { Session } from '../../types.js'

/**
 * `browser.setTimeout({ implicit })`: how long the commands of an element
 * wait for it from now on. It is the action timeout of Mobilewright
 * (`use.actionTimeout`), changed while the test runs. It goes before
 * `actionTimeout` of the capability `mobilecli:options`.
 *
 * The other two timeouts of WebDriver, `pageLoad` and `script`, do nothing:
 * a native app has no pages and no scripts. They are not an error, because
 * WebdriverIO itself sets the script timeout when an iOS session starts.
 */
export async function setTimeouts (session: Session, implicit?: number) {
    if (implicit !== undefined) {
        if (typeof implicit !== 'number' || !Number.isFinite(implicit) || implicit < 0) {
            throw new Error(`The timeout "implicit" has to be a number of 0 or more, got: ${JSON.stringify(implicit)}`)
        }
        session.timeouts.implicit = implicit
    }
    return null
}
