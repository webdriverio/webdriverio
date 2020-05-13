/**
 * 
 * Is Element Enabled determines if the referenced element is enabled or not. 
 * This operation only makes sense on form controls.
 * 
 */

import getElementAttribute from './getElementAttribute'

export default async function isElementEnabled ({ elementId }) {
    const result = await getElementAttribute.call(this, { elementId, name: 'disabled' })
    return result === null
}
