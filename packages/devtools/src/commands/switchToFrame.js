import uuidv4 from 'uuid/v4'

import findElements from './findElements'
import { ELEMENT_KEY } from '../constants'

async function switchFrame (elementHandle) {
    const contentFrame = await elementHandle.contentFrame()

    if (!contentFrame) {
        throw new Error('no such frame')
    }

    const handle = uuidv4()
    this.currentWindowHandle = handle
    this.windows.set(handle, contentFrame)
    return null
}

export default async function switchToFrame ({ id }) {
    const page = this.windows.get(this.currentWindowHandle)
    const elementHandle = this.elementStore.get(id)

    /**
     * switch frame by element ID
     */
    if (typeof id === 'string' && elementHandle) {
        return switchFrame.call(this, elementHandle)
    }

    /**
     * switch frame by number
     */
    if (typeof id === 'number') {
        const iFrames = await findElements.call(this, { using: 'css selector', value: 'iframe' })
        const frameHandle = iFrames[id]

        if (!frameHandle) {
            throw new Error('no such frame')
        }

        const elementHandle = this.elementStore.get(frameHandle[ELEMENT_KEY])
        return switchFrame.call(this, elementHandle)
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
