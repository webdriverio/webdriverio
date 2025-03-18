import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Window Handles command returns a list of window handles
 * for every open top-level browsing context.
 * The order in which the window handles are returned is arbitrary.
 *
 * @alias browser.getWindowHandles
 * @see https://w3c.github.io/webdriver/#dfn-get-window-handles
 * @return {string[]}  An array which is a list of window handles.
 */
export default async function getWindowHandles(this: DevToolsDriver) {
    return Array.from(this.windows.keys())
}
