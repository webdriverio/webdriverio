import executeScript from './executeScript'

import { getStaleElementError } from '../utils'
import { ELEMENT_KEY } from '../constants'

const SCROLL_INTO_VIEW_SCRIPT = 'return (function scrollIntoView (elem) { elem.scrollIntoView() }).apply(null, arguments)'

export default async function isElementDisplayed ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    /**
     * scroll element into view
     */
    await executeScript.call(this, {
        script: SCROLL_INTO_VIEW_SCRIPT,
        args: [{ [ELEMENT_KEY]: elementId }]
    })

    return elementHandle.isIntersectingViewport()
}
