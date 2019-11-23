/**
 * check if element is within the viewport or is overlapped by another element or disabled
 * @param  {HTMLElement} elem  element to check
 * @return {Boolean}           false if element is not overlapped
 */
export default function isElementClickable (elem) {
    if (!elem.getBoundingClientRect || !elem.scrollIntoView || !elem.contains || !elem.getClientRects || !document.elementFromPoint) {
        return false
    }

    // get overlapping element
    function getOverlappingElement (elem) {
        const elemDimension = elem.getBoundingClientRect()
        const x = elemDimension.left + (elem.clientWidth / 2)
        const y = elemDimension.top + (elem.clientHeight / 2)
        return document.elementFromPoint(x, y)
    }

    // get overlapping element rects (currently only the first)
    // applicable if element's text is multiline.
    function getOverlappingRects (elem) {
        const elems = []

        const rects = elem.getClientRects()
        // webdriver clicks on center of the first element's rect (line of text), it might change in future
        const rect = rects[0]
        const x = rect.left + (rect.width / 2)
        const y = rect.top + (rect.height / 2)
        elems.push(document.elementFromPoint(x, y))

        return elems
    }

    // get overlapping elements
    function getOverlappingElements (elem) {
        return [getOverlappingElement(elem), ...getOverlappingRects(elem)]
    }

    // is one of overlapping elements the `elem` or one of its child
    function isOverlappingElementMatch (elementsFromPoint, elem) {
        return elementsFromPoint.some(elementFromPoint => elementFromPoint === elem || elem.contains(elementFromPoint))
    }

    // copied from `isElementInViewport.js`
    function isElementInViewport (elem) {
        if (!elem.getBoundingClientRect) {
            return false
        }

        const rect = elem.getBoundingClientRect()

        const windowHeight = (window.innerHeight || document.documentElement.clientHeight)
        const windowWidth = (window.innerWidth || document.documentElement.clientWidth)

        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) > 0)
        const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) > 0)

        return (vertInView && horInView)
    }

    function isClickable (elem) {
        return isElementInViewport(elem) && elem.disabled !== true && isOverlappingElementMatch(getOverlappingElements(elem), elem)
    }

    // returns true for Chrome and Firefox and false for Safari, Edge and IE
    let scrollIntoViewFullSupport = !window.safari || !window.StyleMedia

    // scroll to the element if it's not clickable
    if (!isClickable(elem)) {
        // works well in dialogs, but the element may be still overlapped by some sticky header/footer
        elem.scrollIntoView(scrollIntoViewFullSupport ? { block: 'nearest', inline: 'nearest' } : false)

        // if element is still not clickable take another scroll attempt
        if (!isClickable(elem)) {
            // scroll to element, try put it in the screen center.
            // Should definitely work even if element was covered with sticky header/footer
            elem.scrollIntoView({ block: 'center', inline: 'center' })

            return isClickable(elem)
        }
    }

    return true
}
