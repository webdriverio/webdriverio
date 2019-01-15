const BUTTON_ENUM = {
    left: 0,
    middle: 1,
    right: 2
}

/**
 * call must be scoped to the webdriverio client
 */
let handleMouseButtonProtocol = function (requestPath, button) {
    if (typeof button !== 'number') {
        button = BUTTON_ENUM[button || 'left']
    }

    return this.requestHandler.create(
        requestPath,
        { button: button }
    )
}

export default handleMouseButtonProtocol
