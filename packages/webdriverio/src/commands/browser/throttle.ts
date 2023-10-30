import type { ThrottleOptions } from '../../utils/interception/types.js'
import { getBrowserObject } from '../../utils/index.js'

/**
 * Alias for throttleNetwork. The browser.throttle command will be removed in v9.
 */
export async function throttle (
    this: WebdriverIO.Browser,
    params: ThrottleOptions
) {
    const browser = getBrowserObject(this)
    await browser.throttleNetwork(params)
}