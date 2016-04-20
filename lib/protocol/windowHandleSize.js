/**
 *
 * Protocol binding to get or change the size of the browser.
 *
 * <example>
    :windowHandleSize.js
    // get the size of
    // a specified window
    client.windowHandleSize('dc30381e-e2f3-9444-8bf3-12cc44e8372a');

    // the current window
    client.windowHandleSize();

    // change the size of
    // a specified window
    client.windowHandleSize('dc30381e-e2f3-9444-8bf3-12cc44e8372a', {width: 800, height: 600});

    // the current window
    client.windowHandleSize({width: 800, height: 600});
 * </example>
 *
 * @param {String=} windowHandle the window to receive/change the size
 * @param {Object=} dimension    the new size of the window
 *
 * @returns {Object} the size of the window (`{width: number, height: number}`)
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-set-window-size
 * @type protocol
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let windowHandleSize = function (windowHandle = 'current', size) {
    let data = {}

    if (typeof windowHandle === 'object') {
        [windowHandle, size] = ['current', windowHandle]
    }

    /*!
     * protocol options
     */
    let requestOptions = {
        path: `/session/:sessionId/window/${windowHandle}/size`,
        method: 'GET'
    }

    /*!
     * change window size if the new size is given
     */
    if (typeof size === 'object' && size.width && size.height) {
        requestOptions.method = 'POST'
        // The width and height value might return as a negative value, so
        // we make sure to use its absolute value.
        data = {
            width: Math.abs(size.width),
            height: Math.abs(size.height)
        }
    }

    /*!
     * type check
     */
    if (requestOptions.method === 'POST' && typeof data.width !== 'number' && typeof data.height !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with windowHandleSize protocol command')
    }

    return this.requestHandler.create(requestOptions, data)
}

export default windowHandleSize
