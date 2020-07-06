/**
 * The Get Page Source command returns a string serialization of the DOM
 * of the current browsing context active document.
 *
 * @see https://w3c.github.io/webdriver/#dfn-get-page-source
 * @alias browser.getPageSource
 * @return {string}  the DOM of the current browsing context active document
 */

export default function getPageSource () {
    const page = this.getPageHandle(true)
    return page.content()
}
