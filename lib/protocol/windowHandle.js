/**
 * Retrieve the current window handle.
 *
 * <example>
    :windowHandle.js
    it('should return window handle', function () {
        browser.url('http://webdriver.io');

        var handle = browser.windowHandle()
        console.log(handle);
        // outputs something like the following:
        //  {
        //      state: 'success',
        //      sessionId: 'e6782264-9eb1-427b-9250-d8302ac35161',
        //      hCode: 988127308,
        //      value: 'CDwindow-849D79B1-5CCB-4A1D-A217-5BA809D935F3',
        //      class: 'org.openqa.selenium.remote.Response',
        //      status: 0
        //  }
    });
 * </example>
 *
 * @return {String} the current window handle
 *
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-window-handle
 * @type protocol
 *
 */

import { isUnknownCommand } from '../helpers/utilities'

export default function windowHandle () {
    return this.requestHandler.create('/session/:sessionId/window_handle').catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (isUnknownCommand(err)) {
            return this.requestHandler.create('/session/:sessionId/window')
        }

        throw err
    })
}
