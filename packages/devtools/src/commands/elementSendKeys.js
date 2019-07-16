export default async function elementSendKeys ({ elementId, text }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    await elementHandle.focus()
    const page = this.windows.get(this.currentWindowHandle)
    await page.keyboard.type(text)

    return null
}
