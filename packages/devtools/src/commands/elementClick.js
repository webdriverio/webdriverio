import getElementTagName from './getElementTagName'
import executeScript from './executeScript'
import { ELEMENT_KEY } from '../constants'

const SELECT_SCRIPT = 'return (function select (elem) { elem.selected = true }).apply(null, arguments)'
const PAGELOAD_WAIT_TIMEOUT = 150

export default async function elementClick ({ elementId }) {
    const page = this.getPageHandle()
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw new Error(`Couldn't find element with id ${elementId} in cache`)
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
        page.once('framenavigated', () => {
            clearTimeout(waitForPageLoadTimeout)
            page.once('load', () => resolve(null))
        })

        const dialogHandler = () => resolve()
        page.once('dialog', dialogHandler)
        return elementHandle.click().then(() => {
            page.removeListener('dialog', dialogHandler)

            /**
             * wait for at least 150ms to see if a page load was triggered
             */
            waitForPageLoadTimeout = setTimeout(() => {
                resolve(null)
            }, PAGELOAD_WAIT_TIMEOUT)
        }).catch(reject)
    })
}
