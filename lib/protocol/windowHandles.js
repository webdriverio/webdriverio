/**
 *
 * Retrieve the list of all window handles available to the session.
 *
 * <example>
    :windowHandles.js
    it('should return all window handles', function () {
        browser.url('http://localhost/one.html');
        browser.newWindow('http://localhost/two.html');

        var windowHandles = browser.windowHandles()
        console.log(windowHandles);
        // Outputs something like
        // {
        //    state: 'success',
        //    sessionId: '31dc8253-a27e-4bae-8d20-338d6b0541c9',
        //    hCode: 273402755,
        //    value:
        //    [ 'CDwindow-CBFE1412-8D46-495C-96B4-42E04F9153C0',
        //        'CDwindow-BD7BE568-52F2-4552-B834-FE2D041DCE5B' ],
        //    class: 'org.openqa.selenium.remote.Response',
        //    status: 0
        // }
        // set focus on different windows
        var window1 = windowHandles.value[0];
        var window2 = windowHandles.value[1];
        var title1 = browser.window(window1).getTitle();
        console.log(title1); // title of one.html
        var title2 = browser.window(window2).getTitle();
        console.log(title2); // title of two.html
    });
 * </example>
 *
 * @return {String[]} a list of window handles
 *
 * @see https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-window-handles
 * @type protocol
 *
 */

import { isUnknownCommand } from '../helpers/utilities'

let windowHandles = function () {
    return this.requestHandler.create('/session/:sessionId/window_handles').catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (isUnknownCommand(err)) {
            return this.requestHandler.create('/session/:sessionId/window/handles')
        }

        throw err
    })
}

export default windowHandles
