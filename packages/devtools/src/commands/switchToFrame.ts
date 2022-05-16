import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page.js'
import type { Frame } from 'puppeteer-core/lib/cjs/puppeteer/common/FrameManager.js'
import type { ElementReference } from '@wdio/protocols'

import { ELEMENT_KEY } from '../constants.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Switch To Frame command is used to select the current top-level browsing context
 * or a child browsing context of the current browsing context to use as the current
 * browsing context for subsequent commands.
 *
 * @alias browser.switchToFrame
 * @see https://w3c.github.io/webdriver/#dfn-switch-to-frame
 * @param {string|object|null} id  one of three possible types: null: this represents the top-level browsing context (i.e., not an iframe), a Number, representing the index of the window object corresponding to a frame, an Element object received using `findElement`.
 */
export default async function switchToFrame (
    this: DevToolsDriver,
    { id }: { id: string }
) {
    const page = this.getPageHandle(true) as unknown as Frame

    /**
     * switch to parent frame
     */
    if (id === null) {
        /**
         * if we are already in the parent frame, don't do anything
         */
        if (typeof page.parentFrame !== 'function') {
            return { id: null }
        }

        let parentFrame = await page.parentFrame()
        while (parentFrame) {
            parentFrame = await parentFrame.parentFrame()
        }
        this.currentFrame = parentFrame as unknown as Page
        return { id: null }
    }

    /**
     * switch frame by element ID
     */
    const idAsElementReference = id as unknown as ElementReference
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
        return { id: idAsElementReference[ELEMENT_KEY] }
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
        return { id: childFrame._id }
    }

    throw new Error(`Could not switch frame, unknown id: ${id}`)
}
