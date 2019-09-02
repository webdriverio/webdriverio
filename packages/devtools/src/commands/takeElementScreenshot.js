import { getStaleElementError } from '../utils'

export default async function takeElementScreenshot ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementHandle)
    }

    return elementHandle.screenshot({
        encoding: 'base64',
        type: 'png'
    })
}
