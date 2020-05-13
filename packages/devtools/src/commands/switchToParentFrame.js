/**
 * 
 * The Switch to Parent Frame command sets the current browsing context for future commands 
 * to the parent of the current browsing context.
 * 
 */

export default async function switchToParentFrame () {
    const page = this.getPageHandle(true)

    /**
     * check if we can access child frames, if now we are already in the
     * parent browsing context
     */
    if (typeof page.parentFrame !== 'function') {
        return null
    }

    this.currentFrame = await page.parentFrame()
    return null
}
