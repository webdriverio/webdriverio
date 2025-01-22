import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The navigateTo (go) command is used to cause the user agent to navigate the current
 * top-level browsing context a new location.
 *
 * @alias browser.navigateTo
 * @see https://w3c.github.io/webdriver/#dfn-navigate-to
 * @param  {string} url  current top-level browsing context’s active document’s document URL
 * @return {string}      current document URL of the top-level browsing context.
 */
export default async function navigateTo (
    this: DevToolsDriver,
    { url }: { url: string }
) {
    /**
     * when navigating to a new url get out of frame scope
     */
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.goto(url)
    return null
}
