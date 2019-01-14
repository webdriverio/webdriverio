import { ProtocolError } from '../utils/ErrorHandler'

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
    ).catch(err => {
        if (ProtocolError(err)) {
            return this.actions([{
                type: 'pointer',
                id: 'mouse',
                parameters: { pointerType: 'mouse' },
                actions: [
                    { type: 'pointerDown', button: button },
                    { type: 'pointerUp', button: button }
                ]
            }])
        }

        return err
    })
}

export default handleMouseButtonProtocol
