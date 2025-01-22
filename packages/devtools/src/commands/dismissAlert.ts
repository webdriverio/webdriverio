import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Dismiss Alert command dismisses a simple dialog if present, otherwise error.
 * A request to dismiss an alert user prompt, which may not necessarily have a dismiss button,
 * has the same effect as accepting it.
 *
 * @alias browser.dismissAlert
 * @see https://w3c.github.io/webdriver/#dfn-dismiss-alert
 */
export default async function dismissAlert (this: DevToolsDriver) {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    await this.activeDialog.dismiss()
    delete this.activeDialog
    return null
}
