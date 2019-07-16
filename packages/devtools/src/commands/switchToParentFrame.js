import { switchFrame } from '../utils'

export default async function switchToParentFrame () {
    const page = this.windows.get(this.currentWindowHandle)

    /**
     * check if we can access child frames, if now we are already in the
     * parent browsing context
     */
    if (typeof page.parentFrame !== 'function') {
        return null
    }

    const parentFrame = await page.parentFrame()

    for (const [handle, frame] of this.windows) {
        if (frame === parentFrame) {
            this.currentWindowHandle = handle
            return null
        }
    }

    return switchFrame.call(this, parentFrame)
}
