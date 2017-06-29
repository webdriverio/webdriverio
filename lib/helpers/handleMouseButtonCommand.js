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
    if (selector === undefined) {
        return this.buttonPress(button)
    }

    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        /**
         * simulate event in safari
         */
        if (this.desiredCapabilities.browserName === 'safari') {
            return this.moveTo(res.value[Object.keys(res.value)[0]], xoffset, yoffset).execute((elem, x, y, button) => {
                return window._wdio_simulate(elem, 'mousedown', 0, 0, button) &&
                       window._wdio_simulate(elem, 'mouseup', 0, 0, button)
            }, res.value, xoffset, yoffset, button)
        }

        return this.moveTo(res.value[Object.keys(res.value)[0]], xoffset, yoffset).buttonPress(button)
    })
}

export default handleMouseButtonCommand
