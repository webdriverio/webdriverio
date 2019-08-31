export default function getAlertText () {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    return this.activeDialog.message()
}
