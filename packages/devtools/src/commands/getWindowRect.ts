import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../constants.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Window Rect command returns the size and position on the screen of the operating system window
 * corresponding to the current top-level browsing context.
 *
 * @alias browser.getWindowRect
 * @see https://w3c.github.io/webdriver/#dfn-get-window-rect
 * @return {object}  A JSON representation of a "window rect" object. This has 4 properties: `x`, `y`, `width` and `height`.
 */
export default async function getWindowRect (this: DevToolsDriver) {
    const page = this.getPageHandle()
    const viewport = await page.viewport() || {}
    return Object.assign(
        { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: 0, y: 0 },
        viewport
    )
}
