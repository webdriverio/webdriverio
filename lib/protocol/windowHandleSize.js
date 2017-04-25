/**
 *
 * Protocol binding to get or change the size of the browser.
 *
 * <example>
    :windowHandleSize.js
    it('should get or set window position', function () {
        // change the size of a specified window
        client.windowHandleSize('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}', {width: 800, height: 600});
        // or set the current window size
        browser.windowHandleSize({width: 800, height: 600});

        // get the size of a specified window
        var size = browser.windowHandleSize('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}');
        // or of the current window
        size = browser.windowHandleSize();

        console.log(size); // outputs: {width: 800, height: 600}
    });
 * </example>
 *
 * @param {String=} windowHandle the window to receive/change the size
 * @param {Object=} dimension    the new size of the window
 *
 * @return {Object} the size of the window (`{width: number, height: number}`)
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

    return this.requestHandler.create(requestOptions, data).catch(() => {
        /**
         * use W3C path if old path failed
         */
        requestOptions.path = '/session/:sessionId/window/rect'
        return this.requestHandler.create(requestOptions, data)
    })
}

export default windowHandleSize
