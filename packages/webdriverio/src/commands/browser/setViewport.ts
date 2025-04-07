/// <reference path="../../types.ts" />
import { getBrowserObject } from '@wdio/utils'
import { getContextManager } from '../../session/context.js'
import { isBrowsingContext } from 'src/utils/index.js'

const minWindowSize = 0
const maxWindowSize = Number.MAX_SAFE_INTEGER

export interface SetViewportOptions {
    width: number
    height: number
    devicePixelRatio?: number
}

/**
 * Resizes the browser viewport within the browser. As oppose to `setWindowSize`,
 * this command changes the viewport size, not the window size.
 *
 * <example>
 * :setWindowSize.js
    it('should set viewport to emulate iPhone 15', async () => {
        await browser.setWindowSize({
            width: 393,
            height: 659,
            deviceScaleFactor: 3
        });
    });
 * </example>
 *
 * @alias browser.setWindowSize
 * @param {SetViewportOptions} options                  command arguments
 * @param {number}             options.width            viewport width in pixels
 * @param {number}             options.height           viewport height in pixels
 * @param {number}             options.devicePixelRatio pixel ratio of the viewport
 * @return {`Promise<void>`}
 * @type window
 */
export async function setViewport(
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    options: SetViewportOptions
) {
    /**
     * type check
     */
    if (!Number.isInteger(options.width) || !Number.isInteger(options.height)) {
        throw new Error('setViewport expects width and height to be an integer')
    }

    /**
     * value check
     */
    if (options.width < minWindowSize || options.width > maxWindowSize || options.height < minWindowSize || options.height > maxWindowSize) {
        throw new Error(`setViewport expects width and height to be a number in the range of ${minWindowSize} to ${maxWindowSize}`)
    }

    if (options.devicePixelRatio && (!Number.isInteger(options.devicePixelRatio) || options.devicePixelRatio < 0)) {
        throw new Error(`setViewport expects devicePixelRatio to be a number in the range of ${minWindowSize} to ${maxWindowSize}`)
    }

    const browser = getBrowserObject(this)
    const contextManager = getContextManager(browser)
    const context = isBrowsingContext(this)
        ? this.contextId
        : await contextManager.getCurrentContext()

    await browser.browsingContextSetViewport({
        context,
        devicePixelRatio: options.devicePixelRatio || 1,
        viewport: {
            width: options.width,
            height: options.height
        }
    })
}
