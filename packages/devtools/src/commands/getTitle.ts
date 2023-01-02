import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Title command returns the document title of the current top-level
 * browsing context, equivalent to calling `document.title`.
 *
 * @alias browser.getTitle
 * @see https://w3c.github.io/webdriver/#dfn-get-title
 * @return {string}  Returns a string which is the same as `document.title` of the current top-level browsing context.
 */
export default async function getTitle (this: DevToolsDriver) {
    const page = this.getPageHandle(true)
    return page.title()
}
