/**
 * opens new window via window.open
 * @param  {string} url            The URL to be loaded in the newly opened window.
 * @param  {string} windowName     A string name for the new window.
 * @param  {string} windowFeatures An optional parameter listing the features (size, position, scrollbars, etc.) of the new window as a string.
 *
 * @see  https://developer.mozilla.org/en-US/docs/Web/API/Window.open
 */
export default function newWindow (
    url: string,
    windowName: string,
    windowFeatures: string
) {
    window.open(url, windowName || '', windowFeatures || '')
}
