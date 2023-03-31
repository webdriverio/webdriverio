import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import type { Frame } from 'puppeteer-core/lib/esm/puppeteer/common/Frame.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Switch to Parent Frame command sets the current browsing context for future commands
 * to the parent of the current browsing context.
 *
 * @alias browser.switchToParentFrame
 * @see https://w3c.github.io/webdriver/#dfn-switch-to-parent-frame
 */
export default async function switchToParentFrame (this: DevToolsDriver) {
    const page = this.getPageHandle(true) as unknown as Frame

    /**
     * check if we can access child frames, if now we are already in the
     * parent browsing context
     */
    if (typeof page.parentFrame !== 'function') {
        return null
    }

    /**
     * ToDo(Christian): investigate why we interchangeably use Page and Frames here
     */
    this.currentFrame = await page.parentFrame() as unknown as Page
    return null
}
