import { getStaleElementError } from '../utils'

export default async function elementSendKeys ({ elementId, text }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    await elementHandle.focus()
    const page = this.getPageHandle()
    await page.keyboard.type(text)

    return null
}
