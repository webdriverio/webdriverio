/* global window */
export default async function getElementCSSValue ({ elementId, propertyName }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    return page.$eval(
        'html',
        (_, elem, propertyName) => window.getComputedStyle(elem)[propertyName],
        elementHandle, propertyName
    )
}
