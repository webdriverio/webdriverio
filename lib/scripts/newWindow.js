
/**
 * opens new window via window.open
 * @param  {String} url            The URL to be loaded in the newly opened window.
 * @param  {String} windowName     A string name for the new window.
 * @param  {String} windowFeatures An optional parameter listing the features (size, position, scrollbars, etc.) of the new window as a string.
 *
 * @see  https://developer.mozilla.org/en-US/docs/Web/API/Window.open
 */

/* global window */
let newWindow = function (url, windowName = 'new window', windowFeatures = '') {
    window.open(url, windowName, windowFeatures)
}

export default newWindow
