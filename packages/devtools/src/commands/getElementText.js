/**
 * 
 * The Get Element Text command intends to return an element’s text \"as rendered\". 
 * An element's rendered text is also used for locating a elements 
 * by their link text and partial link text.
 * 
 */


import command from '../scripts/getElementText'
import { getStaleElementError } from '../utils'

export default function getElementText ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle)
}
