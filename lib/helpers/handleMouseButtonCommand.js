import { RuntimeError } from '../utils/ErrorHandler'

/**
 * call must be scoped to the webdriverio client
 */
let handleMouseButtonCommand = function (selector, button, xoffset, yoffset) {
    /**
     * mobile only supports simple clicks
     */
    if (this.isMobile) {
        return this.click(selector)
    }

    /**
     * just press button if no selector is given
     */
    if (!selector) {
        return this.buttonPress(button)
    }

    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.moveTo(res.value.ELEMENT, xoffset, yoffset).buttonPress(button)
    })
}

export default handleMouseButtonCommand
