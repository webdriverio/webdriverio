export default function getElementRect ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    return page.$eval('html', (html, elem) => {
        const { x, y, width, height } = elem.getBoundingClientRect()
        return { x, y, width, height }
    }, elementHandle)
}
