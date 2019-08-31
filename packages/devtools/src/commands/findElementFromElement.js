import findElementByXPath from '../scripts/findElementByXPath'
import cleanUp from '../scripts/cleanUpSerializationSelector'
import { SUPPORTED_SELECTOR_STRATEGIES, SERIALIZE_SELECTOR, SERIALIZE_PROPERTY } from '../constants'
import { findElement } from '../utils'

export default async function findElementFromElement ({ elementId, using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.getPageHandle()
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
    }

    let needsCleanUp = false
    let result

    if (using === 'link text') {
        using = 'xpath'
        value = `.//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `.//a[contains(., "${value}")]`
    }

    if (using === 'xpath') {
        const foundElement = await elementHandle.$eval('*', findElementByXPath, value, elementHandle, SERIALIZE_PROPERTY)

        if (!foundElement) {
            throw new Error(`Element with selector "${value}" not found`)
        }

        value = SERIALIZE_SELECTOR
        needsCleanUp = true

        /**
         * with xPath it is possible to fetch element outside of the
         * scoped element using `//` in the beginning of the query
         */
        result = await findElement.call(this, page, value)
    } else {
        result = await findElement.call(this, elementHandle, value)
    }

    /**
     * clean up data property
     */
    if (needsCleanUp) {
        await page.$eval(SERIALIZE_SELECTOR, cleanUp, SERIALIZE_PROPERTY)
    }

    return result
}
