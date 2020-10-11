/**
 * The Get Element Property command will return the result of getting a property of an element.
 *
 * @alias browser.getElementProperty
 * @see https://w3c.github.io/webdriver/#dfn-get-element-property
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} name       name of the attribute property to retrieve
 * @return {string}           The named property of the element, accessed by calling GetOwnProperty on the element object.
 */

import { getStaleElementError } from '../utils'

export default async function getElementProperty ({ elementId, name }) {
    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const jsHandle = await elementHandle.getProperty(name)
    return jsHandle.jsonValue()
}
