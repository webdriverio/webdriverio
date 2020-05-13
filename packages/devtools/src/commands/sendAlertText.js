/**
 * 
 * The Send Alert Text command sets the text field of a window.prompt user prompt to the given value."
 * 
 */

export default async function sendAlertText ({ text }) {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    await this.activeDialog.accept(text)
    return null
}
