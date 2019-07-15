import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElement } from '../utils'

export default function findElementFromElement ({ elementId, using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    return findElement.call(this, elementHandle, value)
}
