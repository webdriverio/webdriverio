/**
 * 
 * The Switch To Window command is used to select the current top-level browsing context 
 * for the current session, i.e. the one that will be used for processing commands.
 * 
 */

export default async function switchToWindow ({ handle }) {
    if (!this.windows.has(handle)) {
        throw new Error(`window with handle ${handle} not found`)
    }

    delete this.currentFrame
    this.currentWindowHandle = handle
    const page = this.getPageHandle()
    await page.bringToFront()

    return handle
}
