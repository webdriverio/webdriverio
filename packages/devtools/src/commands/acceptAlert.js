/**
 * The Accept Alert command accepts a simple dialog if present, otherwise error.
 *
 * @alias browser.acceptAlert
 * @see https://w3c.github.io/webdriver/#dfn-accept-alert
 */

export default async function acceptAlert() {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    await this.activeDialog.accept()
    delete this.activeDialog
    return null
}
