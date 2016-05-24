import { ProtocolError } from '../utils/ErrorHandler'

/**
 * call must be scoped to the webdriverio client
 */
let handleMouseButtonCommand = function (selector, button, xoffset, yoffset) {
    /**
     * mobile only supports simple clicks
     */
    if (this.isMobile) {
        if (!selector) {
            throw new ProtocolError('the leftClick/middleClick/rightClick command requires an element to click on')
        }

        return this.click(selector)
    }

    /**
     * just press button if no selector is given
     */
    if (!selector) {
        return this.buttonPress(button)
    }

    return this.element(selector).then((res) =>
        this.moveTo(res.value.ELEMENT, xoffset, yoffset).buttonPress(button))
}

export default handleMouseButtonCommand
