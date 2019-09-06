import getElementTagName from './getElementTagName'
import executeScript from './executeScript'
import { ELEMENT_KEY } from '../constants'
import { getStaleElementError } from '../utils'

const SELECT_SCRIPT = 'return (function select (elem) { elem.selected = true }).apply(null, arguments)'
const PAGELOAD_WAIT_TIMEOUT = 1000

export default async function elementClick ({ elementId }) {
    const page = this.getPageHandle()
    const elementHandle = this.elementStore.get(elementId)

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
        return executeScript.call(this, {
            script: SELECT_SCRIPT,
            args: [{ [ELEMENT_KEY]: elementId }]
        })
    }

    /**
     * ensure to fulfill the click promise if the click has triggered an alert
     */
    return new Promise((resolve, reject) => {
        let waitForPageLoadTimeout

        /**
         * check if page load has happened due to click
         */
        const frameNavigatedHandler = () => {
            /**
             * if so clear the `waitForPageLoadTimeout` to prevent command
             * to finish and wait until the page has loaded
             */
            clearTimeout(waitForPageLoadTimeout)
            page.once('load', () => resolve(null))
        }
        page.once('framenavigated', frameNavigatedHandler)

        /**
         * listen on possible modal dialogs that might pop up due to the
         * click action, just continue in this case
         */
        const dialogHandler = () => {
            clearTimeout(waitForPageLoadTimeout)
            resolve()
        }
        page.once('dialog', dialogHandler)
        return elementHandle.click().then(() => {
            /**
             * no modals popped up, so clean up the listener
             */
            page.removeListener('dialog', dialogHandler)

            /**
             * wait for at least 150ms to see if a page load was triggered,
             * if so the we handle the command in the `frameNavigatedHandler`
             */
            waitForPageLoadTimeout = setTimeout(() => {
                /**
                 * no page load was triggered, continue
                 */
                resolve(null)
            }, PAGELOAD_WAIT_TIMEOUT)
        }).catch(reject)
    })
}
