/**
 * 
 * The Set Window Rect command alters the size and the position of the operating system window 
 * corresponding to the current top-level browsing context.
 * 
 */

export default async function setWindowRect (params) {
    const page = this.getPageHandle()
    await page.setViewport(params)
    return { width: params.width, height: params.height }
}
