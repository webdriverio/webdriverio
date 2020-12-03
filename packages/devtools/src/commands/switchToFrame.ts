/**
 * The Switch To Frame command is used to select the current top-level browsing context
 * or a child browsing context of the current browsing context to use as the current
 * browsing context for subsequent commands.
 *
 * @alias browser.switchToFrame
 * @see https://w3c.github.io/webdriver/#dfn-switch-to-frame
 * @param {string|object|null} id  one of three possible types: null: this represents the top-level browsing context (i.e., not an iframe), a Number, representing the index of the window object corresponding to a frame, an Element object received using `findElement`.
 */
import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { Frame } from 'puppeteer-core/lib/cjs/puppeteer/common/FrameManager'

import { ELEMENT_KEY } from '../constants'
import { getStaleElementError } from '../utils'
import type DevToolsDriver from '../devtoolsdriver'

export default async function switchToFrame (
    this: DevToolsDriver,
    { id }: { id: string }
) {
    const page = this.getPageHandle(true) as unknown as Frame

    /**
     * switch to parent frame
     */
    if (id === null && typeof page.parentFrame === 'function') {
        let parentFrame = await page.parentFrame()
        while (parentFrame) {
            parentFrame = await parentFrame.parentFrame()
        }
        this.currentFrame = parentFrame as unknown as Page
        return null
    }

    /**
     * switch frame by element ID
     */
    const idAsElementReference = id as unknown as WebDriver.ElementReference
    if (typeof idAsElementReference[ELEMENT_KEY] === 'string') {
        const elementHandle = await this.elementStore.get(idAsElementReference[ELEMENT_KEY])

        if (!elementHandle) {
            throw getStaleElementError(id)
        }

        const contentFrame = await elementHandle.contentFrame()

        if (!contentFrame) {
            throw new Error('no such frame')
        }

        this.currentFrame = contentFrame as unknown as Page
        return null
    }

    /**
     * switch frame by number
     */
    if (typeof id === 'number') {
        /**
         * `page` has `frames` method while `frame` has `childFrames` method
         */
        let getFrames = (page as unknown as Page).frames || page.childFrames
        const childFrames = await getFrames.apply(page)
        const childFrame = childFrames[id]

        if (!childFrame) {
            throw new Error('no such frame')
        }

        this.currentFrame = childFrame as unknown as Page
        return null
    }

    throw new Error(`Could not switch frame, unknwon id: ${id}`)
}
