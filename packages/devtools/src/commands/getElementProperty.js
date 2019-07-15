import getElementAttribute from './getElementAttribute'

export default async function getElementProperty (...args) {
    return getElementAttribute.apply(this, args)
}
