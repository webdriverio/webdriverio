/**
 * opens new window via window.open
 * @param  {string} url  The URL to be loaded in the newly opened window.
 *
 * @see  https://developer.mozilla.org/en-US/docs/Web/API/Window.open
 */
export default function newWindow (url: string) {
    window.open(url)
}
