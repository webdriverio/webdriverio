import command from '../scripts/getElementTagName'
import { getStaleElementError } from '../utils'

export default async function getElementTagName ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    const result = await page.$eval('html', command, elementHandle)
    return (result || '').toLowerCase()
}
