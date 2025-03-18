import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Alert Text command returns the message of the current user prompt.
 * If there is no current user prompt, it returns an error.
 *
 * @alias browser.getAlertText
 * @see https://w3c.github.io/webdriver/#dfn-get-alert-text
 * @return {string} The message of the user prompt.
 */
export default function getAlertText (this: DevToolsDriver) {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    return this.activeDialog.message()
}
