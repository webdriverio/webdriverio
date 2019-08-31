import command from '../scripts/getElementCSSValue'

export default async function getElementCSSValue ({ elementId, propertyName }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.getPageHandle()
    return page.$eval('html', command, elementHandle, propertyName)
}
