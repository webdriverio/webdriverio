import command from '../scripts/getElementRect'

export default function getElementRect ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    return page.$eval('html', command, elementHandle)
}
