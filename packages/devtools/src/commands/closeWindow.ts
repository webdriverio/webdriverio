import { v4 as uuidv4 } from 'uuid'
import { sleep } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Close Window command closes the current top-level browsing context.
 * Once done, if there are no more top-level browsing contexts open,
 * the WebDriver session itself is closed.
 *
 * @alias browser.closeWindow
 * @see https://w3c.github.io/webdriver/#dfn-close-window
 */
export default async function closeWindow (this: DevToolsDriver) {
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.close()
    await sleep(100)

    const handles = [...this.windows.keys()]
    this.currentWindowHandle = handles[handles.length - 1]

    if (!this.currentWindowHandle) {
        const page = await this.browser.newPage()
        const newWindowHandle = uuidv4()
        this.windows.set(newWindowHandle, page)
        this.currentWindowHandle = newWindowHandle
    }

    const newPage = this.getPageHandle()
    await newPage.bringToFront()
    return this.currentWindowHandle
}
