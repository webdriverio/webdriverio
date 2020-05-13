/**
 * 
 * The Refresh command causes the browser to reload the page in current top-level browsing context.
 * 
 */

export default async function refresh () {
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.reload()
    return null
}
