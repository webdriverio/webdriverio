import { NATIVE_CONTEXT } from '../../constants.js'

/**
 * WebdriverIO asks for the handle when the session starts. The driver only
 * knows the native app for now. A web view gets its own handle when the
 * driver supports web views.
 */
export async function getWindowHandle () {
    return NATIVE_CONTEXT
}
