import findElementByXPath from '../scripts/findElementByXPath'
import { SUPPORTED_SELECTOR_STRATEGIES, SERIALIZE_PROPERTY, SERIALIZE_SELECTOR } from '../constants'
import { findElement as findElementUtil } from '../utils'
import cleanUp from '../scripts/cleanUpSerializationSelector'

export default async function findElement ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.getPageHandle()
    let needsCleanUp = false

    if (using === 'xpath') {
        const foundElement = await page.$eval('html', findElementByXPath, value, null, SERIALIZE_PROPERTY)

        if (!foundElement) {
            throw new Error(`Element with selector "${value}" not found`)
        }

        value = SERIALIZE_SELECTOR
        needsCleanUp = true
    }

    const result = await findElementUtil.call(this, page, value)

    /**
     * clean up data property
     */
    if (needsCleanUp) {
        await page.$eval(SERIALIZE_SELECTOR, cleanUp, SERIALIZE_PROPERTY)
    }

    return result
}
