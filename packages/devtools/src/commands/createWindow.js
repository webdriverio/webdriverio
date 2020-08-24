/**
 * Create a new top-level browsing context.
 *
 * @alias browser.createWindow
 * @see https://w3c.github.io/webdriver/#new-window
 * @param {string} type  Set to 'tab' if the newly created window shares an OS-level window with the current browsing context, or 'window' otherwise.
 * @return {object}      New window object containing 'handle' with the value of the handle and 'type' with the value of the created window type
 */

import { v4 as uuidv4 } from 'uuid'

import command from '../scripts/createWindow'

const WINDOW_FEATURES = 'menubar=1,toolbar=1,location=1,resizable=1,scrollbars=1'
const NEW_PAGE_URL = 'about:blank'
const DEFAULT_WINDOW_TYPE = 'tab'

export default async function createWindow ({ type }) {
    type = type || DEFAULT_WINDOW_TYPE
    let newPage

    if (type === 'window') {
        const page = this.getPageHandle()
        await page.evaluate(command, NEW_PAGE_URL, WINDOW_FEATURES)
        const newWindowTarget = await this.browser.waitForTarget(
            (target) => target.url() === NEW_PAGE_URL)

        newPage = await newWindowTarget.page()
    } else {
        newPage = await this.browser.newPage()
    }

    const handle = uuidv4()
    await newPage.bringToFront()

    this.currentWindowHandle = handle
    this.windows.set(handle, newPage)
    return {
        handle: this.currentWindowHandle,
        type
    }
}
