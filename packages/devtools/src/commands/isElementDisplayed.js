import { getStaleElementError } from '../utils'

export default function isElementDisplayed ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    return elementHandle.isIntersectingViewport()
}
