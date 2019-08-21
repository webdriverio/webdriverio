import getElementTagName from './getElementTagName'
import executeScript from './executeScript'
import { ELEMENT_KEY } from '../constants'

const SELECT_SCRIPT = 'return (function select (elem) { elem.selected = true }).apply(null, arguments)'

export default async function elementClick ({ elementId }) {
    const page = this.windows.get(this.currentWindowHandle)
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
        const dialogHandler = () => resolve()
        page.once('dialog', dialogHandler)
        return elementHandle.click().then(() => {
            page.removeListener('dialog', dialogHandler)
            resolve(null)
        }).catch(reject)
    })
}
