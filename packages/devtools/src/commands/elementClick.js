import getElementTagName from './getElementTagName'
import executeScript from './executeScript'
import { ELEMENT_KEY } from '../constants'
import { getStaleElementError } from '../utils'

const SELECT_SCRIPT = 'return (function select (elem) { elem.selected = true }).apply(null, arguments)'

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
        /**
         * listen on possible modal dialogs that might pop up due to the
         * click action, just continue in this case
         */
        const dialogHandler = () => resolve()
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
