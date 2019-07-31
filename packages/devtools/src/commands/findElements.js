import findElementsByXPath from '../scripts/findElementsByXPath'
import cleanUp from '../scripts/cleanUpSerializationSelector'
import { SUPPORTED_SELECTOR_STRATEGIES, SERIALIZE_SELECTOR, SERIALIZE_PROPERTY } from '../constants'
import { findElements as findElementsUtil } from '../utils'

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.windows.get(this.currentWindowHandle)

    let needsCleanUp = false

    if (using === 'xpath') {
        const foundElement = await page.$eval('html', findElementsByXPath, value, null, SERIALIZE_PROPERTY)

        if (!foundElement) {
            return []
        }

        value = SERIALIZE_SELECTOR
        needsCleanUp = true
    }

    const result = await findElementsUtil.call(this, page, value)

    /**
     * clean up data property
     */
    if (needsCleanUp) {
        await page.$eval(SERIALIZE_SELECTOR, cleanUp, SERIALIZE_PROPERTY)
    }

    return result
}
