import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElements as findElementsUtil } from '../utils'

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    return findElementsUtil.call(this, page, value)
}
