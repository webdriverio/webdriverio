import { ProtocolError } from '../utils/ErrorHandler'

const BUTTON_ENUM = {
    left: 0,
    middle: 1,
    right: 2
}

const REQUEST_PATH_ENUM = {
    down: '/session/:sessionId/buttondown',
    press: '/session/:sessionId/click',
    up: '/session/:sessionId/buttonup'
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
    ).catch(err => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (ProtocolError(err)) {
            let actions = [
                { type: 'pointerDown', button: button },
                { type: 'pointerUp', button: button }
            ]

            if (requestPath === REQUEST_PATH_ENUM['down']) {
                actions = [{ type: 'pointerDown', button: button }]
            } else if (requestPath === REQUEST_PATH_ENUM['up']) {
                actions = [{ type: 'pointerUp', button: button }]
            }

            return this.actions([{
                type: 'pointer',
                id: 'mouse',
                parameters: { pointerType: 'mouse' },
                actions
            }])
        }

        return err
    })
}

export default handleMouseButtonProtocol
