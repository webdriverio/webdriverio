/**
 * The Refresh command causes the browser to reload the page in current top-level browsing context.
 *
 * @alias browser.refresh
 * @see https://w3c.github.io/webdriver/#dfn-refresh
 */
import type DevToolsDriver from '../devtoolsdriver'

export default async function refresh (this: DevToolsDriver) {
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.reload()
    return null
}
