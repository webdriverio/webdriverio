/**
 * 
 * Is Element Selected determines if the referenced element is selected or not. 
 * This operation only makes sense on input elements of the Checkbox- and Radio Button states, 
 * or option elements.
 * 
 */

import getElementProperty from './getElementProperty'
import getElementTagName from './getElementTagName'

export default async function isElementSelected ({ elementId }) {
    const tagName  = await getElementTagName.call(this, { elementId })
    const name = tagName === 'option' ? 'selected' : 'checked'
    const isSelected = await getElementProperty.call(this, { elementId, name })
    return Boolean(isSelected)
}
