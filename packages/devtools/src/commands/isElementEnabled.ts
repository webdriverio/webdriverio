import getElementAttribute from './getElementAttribute.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * Is Element Enabled determines if the referenced element is enabled or not.
 * This operation only makes sense on form controls.
 *
 * @alias browser.isElementEnabled
 * @see https://w3c.github.io/webdriver/#dfn-is-element-enabled
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           If the element is in an xml document, or is a disabled form control: `false`, otherwise, `true`.
 */
export default async function isElementEnabled (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const result = await getElementAttribute.call(this, { elementId, name: 'disabled' })
    return result === null
}
