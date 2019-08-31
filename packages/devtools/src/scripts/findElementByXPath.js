export default function findElement (_, xpath, root, dataProperty) {
    root = root || document
    const element = document.evaluate(xpath, root).iterateNext()

    if (!element) {
        return false
    }

    element.setAttribute(dataProperty, true)
    return true
}
