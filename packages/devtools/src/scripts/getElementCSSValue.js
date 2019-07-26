export default function getElementCSSValue (_, elem, propertyName) {
    return window.getComputedStyle(elem)[propertyName]
}
