import getElementAttribute from './getElementAttribute'

export default async function isElementEnabled ({ elementId }) {
    const result = await getElementAttribute.call(this, { elementId, name: 'disabled' })
    return result === null
}
