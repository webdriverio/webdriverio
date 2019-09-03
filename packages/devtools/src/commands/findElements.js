import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElements as findElementsUtil } from '../utils'

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    if (using === 'link text') {
        using = 'xpath'
        value = `//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `//a[contains(., "${value}")]`
    }

    const page = this.getPageHandle()
    return findElementsUtil.call(this, page, using, value)
}
