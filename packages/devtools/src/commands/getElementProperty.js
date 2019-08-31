export default async function getElementProperty ({ elementId, name }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    const jsHandle = await elementHandle.getProperty(name)
    return jsHandle.jsonValue()
}
