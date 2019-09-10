import command from '../scripts/elementClear'
import { getStaleElementError } from '../utils'

export default async function elementClear ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    await page.$eval('html', command, elementHandle)
    return null
}
