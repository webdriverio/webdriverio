export default async function elementClear ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    await page.$eval('html', (html, elem) => {
        elem.value = ''
    }, elementHandle)
    return null
}
