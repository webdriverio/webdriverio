/**
 * 
 * The Take Screenshot command takes a screenshot of the top-level browsing context's viewport.
 * 
 */

export default async function takeScreenshot () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.screenshot({
        encoding: 'base64',
        fullPage: true,
        type: 'png'
    })
}
