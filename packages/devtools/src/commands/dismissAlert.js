export default async function dismissAlert () {
    if (!this.activeDialog) {
        throw new Error('no such alert')
    }

    await this.activeDialog.dismiss()
    return null
}
