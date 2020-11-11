/**
 * The Forward command causes the browser to traverse one step forwards
 * in the joint session history of the current top-level browsing context.
 *
 * @alias browser.forward
 * @see https://w3c.github.io/webdriver/#dfn-forward
 */
import type DevToolsDriver from '../devtoolsdriver'

export default async function forward (this: DevToolsDriver) {
    delete this.currentFrame
    const page = this.getPageHandle()
    if (!page) {
        throw new Error('Couldn\'t find page')
    }

    await page.goForward()
    return null
}
