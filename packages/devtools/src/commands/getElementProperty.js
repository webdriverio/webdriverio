/**
 * 
 * The Get Element Property command will return the result of getting a property of an element.
 * 
 */

import { getStaleElementError } from '../utils'

export default async function getElementProperty ({ elementId, name }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const jsHandle = await elementHandle.getProperty(name)
    return jsHandle.jsonValue()
}
