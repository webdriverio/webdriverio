/**
 * The Take Screenshot command takes a screenshot of the top-level browsing context's viewport.
 *
 * @alias browser.takeScreenshot
 * @see https://w3c.github.io/webdriver/#dfn-take-screenshot
 * @return {string} The base64-encoded PNG image data comprising the screenshot of the initial viewport.
 */

export default async function takeScreenshot () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.screenshot({
        encoding: 'base64',
        fullPage: true,
        type: 'png'
    })
}
