import getElementAttribute from './getElementAttribute'

export default async function isElementEnabled ({ elementId }) {
    return getElementAttribute.call(this, { elementId, name: 'disabled' })
}
