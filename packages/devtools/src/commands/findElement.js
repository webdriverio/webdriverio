import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElement as findElementUtil } from '../utils'

export default function findElement ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const page = this.windows.get(this.currentWindowHandle)
    return findElementUtil.call(this, page, value)
}
