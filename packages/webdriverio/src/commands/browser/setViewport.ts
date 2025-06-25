/// <reference path="../../types.ts" />
import { getContextManager } from '../../session/context.js'

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
    this: WebdriverIO.Browser,
    options: SetViewportOptions
): Promise<void> {
    /**
     * type check
     */
    if (typeof options.width !== 'number' || typeof options.height !== 'number') {
        throw new Error('setViewport expects width and height of type number')
    }

    /**
     * value check
     */
    if (options.width < minWindowSize || options.width > maxWindowSize || options.height < minWindowSize || options.height > maxWindowSize) {
        throw new Error('setViewport expects width and height to be a number in the 0 to 2^31 − 1 range')
    }

    if (options.devicePixelRatio && (typeof options.devicePixelRatio !== 'number' || options.devicePixelRatio < 0)) {
        throw new Error('setViewport expects devicePixelRatio to be a number in the 0 to 2^31 − 1 range')
    }

    const contextManager = getContextManager(this)
    const context = await contextManager.getCurrentContext()

    await this.browsingContextSetViewport({
        context,
        devicePixelRatio: options.devicePixelRatio || 1,
        viewport: {
            width: options.width,
            height: options.height
        }
    })
}
