/**
 * 
 * The navigateTo (go) command is used to cause the user agent to navigate the current 
 * top-level browsing context a new location.
 * 
 */

export default async function navigateTo ({ url }) {
    /**
     * when navigating to a new url get out of frame scope
     */
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.goto(url)
    return null
}
