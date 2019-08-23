import findElementsByXPath from '../scripts/findElementsByXPath'
import cleanUp from '../scripts/cleanUpSerializationSelector'
import { SUPPORTED_SELECTOR_STRATEGIES, SERIALIZE_SELECTOR, SERIALIZE_PROPERTY } from '../constants'
import { findElements as findElementsUtil } from '../utils'

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.getPageHandle()

    let needsCleanUp = false

    /**
     * technically Puppeteer can not find elements with xPath, this is a
     * workaround where we exeucte some JS in the browser that supports xPaths
     * and then query these marked elements again with Puppeteer
     */
    if (using === 'xpath') {
        /**
         * Find elements using `findElementsByXPath` eval script and mark them
         * by adding a data property to them. They can then be quried in a
         * secondary element call which is why we change the value property
         * here. Return with `true` if elements got found or false if not.
         */
        const foundElement = await page.$eval('html', findElementsByXPath, value, null, SERIALIZE_PROPERTY)

        if (!foundElement) {
            return []
        }

        value = SERIALIZE_SELECTOR
        needsCleanUp = true
    }

    const result = await findElementsUtil.call(this, page, value)

    /**
     * clean up data property that got applied when we queried the elements
     * with an xPath
     */
    if (needsCleanUp) {
        await page.$eval(SERIALIZE_SELECTOR, cleanUp, SERIALIZE_PROPERTY)
    }

    return result
}
