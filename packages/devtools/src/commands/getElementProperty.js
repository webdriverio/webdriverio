import { getStaleElementError } from '../utils'

export default async function getElementProperty ({ elementId, name }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const jsHandle = await elementHandle.getProperty(name)
    return jsHandle.jsonValue()
}
