/**
 * The Take Screenshot command takes a screenshot of the top-level browsing context's viewport.
 *
 * @alias browser.takeScreenshot
 * @see https://w3c.github.io/webdriver/#dfn-take-screenshot
 * @return {string} The base64-encoded PNG image data comprising the screenshot of the initial viewport.
 */
import type DevToolsDriver from '../devtoolsdriver'

export default async function takeScreenshot (this: DevToolsDriver) {
    if (!this.currentWindowHandle) {
        throw new Error('No window handle selected')
    }

    const page = this.windows.get(this.currentWindowHandle)
    if (!page) {
        throw new Error('Couldn\'t find page')
    }

    return page.screenshot({
        encoding: 'base64',
        fullPage: true,
        type: 'png'
    })
}
