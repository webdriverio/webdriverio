import command from '../scripts/getElementText'
import { getStaleElementError } from '../utils'

export default function getElementText ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle)
}
