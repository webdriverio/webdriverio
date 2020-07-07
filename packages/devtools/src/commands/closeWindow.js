/**
 * The Close Window command closes the current top-level browsing context.
 * Once done, if there are no more top-level browsing contexts open,
 * the WebDriver session itself is closed.
 *
 * @alias browser.closeWindow
 * @see https://w3c.github.io/webdriver/#dfn-close-window
 */

import { v4 as uuidv4 } from 'uuid'

export default async function closeWindow () {
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.close()
    this.windows.delete(this.currentWindowHandle)

    const handles = this.windows.keys()
    this.currentWindowHandle = handles.next().value

    if (!this.currentWindowHandle) {
        const page = await this.browser.newPage()
        const newWindowHandle = uuidv4()
        this.windows.set(newWindowHandle, page)
        this.currentWindowHandle = newWindowHandle
    }

    const newPage = this.windows.get(this.currentWindowHandle)
    await newPage.bringToFront()
    return this.currentWindowHandle
}
