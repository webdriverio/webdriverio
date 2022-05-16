import getElementTagName from './getElementTagName.js'
import selectOptionScript from '../scripts/selectOption.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Element Click command scrolls into view the element if it is not already pointer-interactable,
 * and clicks its in-view center point. If the element's center point is obscured by another element,
 * an element click intercepted error is returned.
 *
 * If the element is outside the viewport, an element not interactable error is returned.
 *
 * @alias browser.elementClick
 * @see https://w3c.github.io/webdriver/#dfn-element-click
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 */
export default async function elementClick (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const page = this.getPageHandle()
    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    /**
     * in order to allow clicking on option elements (as WebDriver does)
     * we need to check if the element is such a an element and select
     * it instead of actually executing the click
     */
    const tagName = await getElementTagName.call(this, { elementId })
    if (tagName === 'option') {
        return page.$eval('html', selectOptionScript, elementHandle)
    }

    /**
     * ensure to fulfill the click promise if the click has triggered an alert
     */
    return new Promise((resolve, reject) => {
        /**
         * listen on possible modal dialogs that might pop up due to the
         * click action, just continue in this case
         */
        const dialogHandler = () => resolve(null)
        page.once('dialog', dialogHandler)
        return elementHandle.click().then(() => {
            /**
             * no modals popped up, so clean up the listener
             */
            page.removeListener('dialog', dialogHandler)
            resolve(null)
        }).catch(reject)
    })
}
