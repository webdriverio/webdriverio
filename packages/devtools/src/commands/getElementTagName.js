import command from '../scripts/getElementTagName'

export default async function getElementTagName ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    const result = await page.$eval('html', command, elementHandle)
    return (result || '').toLowerCase()
}
