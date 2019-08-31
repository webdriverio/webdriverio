export default async function takeElementScreenshot ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    return elementHandle.screenshot({
        encoding: 'base64',
        type: 'png'
    })
}
