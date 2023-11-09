import type { ThrottleOptions } from '../../utils/interception/types.js'
import logger from '@wdio/logger'
import { getBrowserObject } from '../../utils/index.js'

const log = logger('webdriverio:throttle')

/**
 * @deprecated use `browser.throttleNetwork` instead
 */
export async function throttle (
    this: WebdriverIO.Browser,
    params: ThrottleOptions
) {
    log.warn('Command "throttle" is deprecated and will be removed with the next major version release! Use `throttleNetwork` instead.')
    const browser = getBrowserObject(this)
    await browser.throttleNetwork(params)
}