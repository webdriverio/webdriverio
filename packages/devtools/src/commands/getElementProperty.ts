import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Element Property command will return the result of getting a property of an element.
 *
 * @alias browser.getElementProperty
 * @see https://w3c.github.io/webdriver/#dfn-get-element-property
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} name       name of the attribute property to retrieve
 * @return {string}           The named property of the element, accessed by calling GetOwnProperty on the element object.
 */
export default async function getElementProperty (
    this: DevToolsDriver,
    { elementId, name }: { elementId: string, name: string }
) {
    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const jsHandle = await elementHandle.getProperty(name)
    if (!jsHandle) {
        return null
    }

    return jsHandle.jsonValue()
}
