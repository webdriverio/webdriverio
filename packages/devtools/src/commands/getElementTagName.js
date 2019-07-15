export default async function getElementTagName ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    const result = await page.$eval('html', (html, elem) => elem.tagName, elementHandle)
    return (result || '').toLowerCase()
}
