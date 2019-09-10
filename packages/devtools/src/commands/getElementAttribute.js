import command from '../scripts/getElementAttribute'
import { getStaleElementError } from '../utils'

export default async function getElementAttribute ({ elementId, name }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle, name)
}
