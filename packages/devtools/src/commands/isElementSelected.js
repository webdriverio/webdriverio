import getElementAttribute from './getElementAttribute'
import getElementTagName from './getElementTagName'

export default async function isElementSelected ({ elementId }) {
    const tagName  = await getElementTagName.call(this, { elementId })
    const name = tagName === 'option' ? 'selected' : 'checked'
    return getElementAttribute.call(this, { elementId, name })
}
