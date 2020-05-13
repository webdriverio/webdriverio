/**
 * 
 * The Get Alert Text command returns the message of the current user prompt. 
 * If there is no current user prompt, it returns an error.
 * 
 */

export default function getAlertText () {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    return this.activeDialog.message()
}
