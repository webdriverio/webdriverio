/**
 *
 * This wait command is your universal weapon if you want to wait on something. It expects a condition
 * and waits until that condition is fulfilled with a truthy value.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element to exist to execute
 * this command.
 *
 * :::
 *
 * A common example is to wait until a certain element contains a certain text (see example).
 *
 * @alias element.waitUntil
 * @param {Function#Boolean}  condition  condition to wait on
 * @param {WaitUntilOptions=} options    command options
 * @param {Number=}           options.timeout     timeout in ms (default: 5000)
 * @param {String=}           options.timeoutMsg  error message to throw when waitUntil times out
 * @param {Number=}           options.interval    interval between condition checks (default: 500)
 * @return {Boolean} true if condition is fulfilled
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitUntil/index.html#L3-L8
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitUntil/waitUntilExample.js#L6-L14
 * @type utility
 *
 */
import { waitUntil as waitUntilBrowser } from '../browser/waitUntil.js'
export const waitUntil = waitUntilBrowser
