import { switchFrame } from '../utils'

export default async function switchToFrame ({ id }) {
    const page = this.windows.get(this.currentWindowHandle)
    const elementHandle = this.elementStore.get(id)

    /**
     * switch frame by element ID
     */
    if (typeof id === 'string' && elementHandle) {
        const contentFrame = await elementHandle.contentFrame()

        if (!contentFrame) {
            throw new Error('no such frame')
        }

        return switchFrame.call(this, contentFrame)
    }

    /**
     * switch frame by number
     */
    if (typeof id === 'number') {
        const childFrames = await page.frames()
        const childFrame = childFrames[id]

        if (!childFrame) {
            throw new Error('no such frame')
        }

        return switchFrame.call(this, childFrame)
    }

    /**
     * switch to parent frame
     */
    if (id === null && typeof page.parentFrame === 'function') {
        let parentFrame = await page.parentFrame()
        while (parentFrame) {
            parentFrame = await page.parentFrame()
        }
        return null
    }

    throw new Error(`Could not switch frame, unknwon id: ${id}`)
}
