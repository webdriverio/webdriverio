/**
 *
 * End the session and close browser. This command is only supported in standalone mode. If you
 * are using the wdio testrunner you can't close the browser before your spec finishes. The testrunner
 * will close the browser for you after the spec has finished.
 *
 * However if you want to refresh the browser session you can try the [`reload`](/api/utility/reload.html)
 * command.
 *
 * <example>
    :endAsync.js
    client
        .init() // starts session and opens the browser
        .url('http://google.com')
        // ... other commands
        .end(); // ends session and close browser
 * </example>
 *
 * @alias browser.end
 * @uses protocol/session
 * @type utility
 *
 */

let end = function () {
    return this.session('delete')
}

export default end
