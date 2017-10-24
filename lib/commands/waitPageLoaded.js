/**
 *
 * Wait until loading current page completes
 *
 * @param {Number=} timeout timeout value in milliseconds
 * @uses utility/waitUntil, protocol/execute
 * @type utility
 */

let waitPageLoaded = function (timeout) {
    return this.waitUntil(function () {
        this.execute('return document.readyState;').value === 'complete'
    }, timeout || this.options.waitforTimeout)
}

export default waitPageLoaded
