import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElements } from '../utils'

export default async function findElementFromElements ({ elementId, using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    if (using === 'link text') {
        using = 'xpath'
        value = `.//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `.//a[contains(., "${value}")]`
    }

    return findElements.call(this, elementHandle, using, value)
}
