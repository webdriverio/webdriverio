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
 * @returns {String} the current window handle
 *
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-window-handle
 * @type protocol
 *
 */

let windowHandle = function () {
    // ToDo fix path according to new Webdriver standard
    return this.requestHandler.create('/session/:sessionId/window_handle')
}

export default windowHandle
