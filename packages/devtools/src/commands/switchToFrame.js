import { ELEMENT_KEY } from '../constants'
import { getStaleElementError } from '../utils'

export default async function switchToFrame ({ id }) {
    const page = this.getPageHandle(true)

    /**
     * switch frame by element ID
     */
    if (typeof id[ELEMENT_KEY] === 'string') {
        const elementHandle = this.elementStore.get(id[ELEMENT_KEY])

        if (!elementHandle) {
            throw getStaleElementError(elementHandle)
        }

        const contentFrame = await elementHandle.contentFrame()

        if (!contentFrame) {
            throw new Error('no such frame')
        }

        this.currentFrame = contentFrame
        return null
    }

    /**
     * switch frame by number
     */
    if (typeof id === 'number') {
        /**
         * `page` has `frames` method while `frame` has `childFrames` method
         */
        let getFrames = page.frames || page.childFrames
        const childFrames = await getFrames()
        const childFrame = childFrames[id]

        if (!childFrame) {
            throw new Error('no such frame')
        }

        this.currentFrame = childFrame
        return null
    }

    /**
     * switch to parent frame
     */
    if (id === null && typeof page.parentFrame === 'function') {
        let parentFrame = await page.parentFrame()
        while (parentFrame) {
            parentFrame = await page.parentFrame()
        }
        this.currentFrame = parentFrame
        return null
    }

    throw new Error(`Could not switch frame, unknwon id: ${id}`)
}
