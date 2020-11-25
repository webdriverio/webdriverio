/**
 * check if element is within the viewport or is overlapped by another element or disabled
 * @param  {Element} elem  element to check
 * @return {Boolean}           false if element is not overlapped
 */
export default function isElementClickable (elem: Element) {
    if (!elem.getBoundingClientRect || !elem.scrollIntoView || !elem.contains || !elem.getClientRects || !document.elementFromPoint) {
        return false
    }

    // Edge before switching to Chromium
    const isOldEdge = !!window.StyleMedia
    // returns true for Chrome and Firefox and false for Safari, Edge and IE
    const scrollIntoViewFullSupport = !((window as any).safari || isOldEdge)

    // get overlapping element
    function getOverlappingElement (elem: Element, context?: Document | ShadowRoot) {
        context = context || document
        const elemDimension = elem.getBoundingClientRect()
        const x = elemDimension.left + (elem.clientWidth / 2)
        const y = elemDimension.top + (elem.clientHeight / 2)
        return context.elementFromPoint(x, y)
    }

    // get overlapping element rects (currently only the first)
    // applicable if element's text is multiline.
    function getOverlappingRects (elem: Element, context?: Document | ShadowRoot) {
        context = context || document
        const elems = []

        const rects = elem.getClientRects()
        // webdriver clicks on center of the first element's rect (line of text), it might change in future
        const rect = rects[0]
        const x = rect.left + (rect.width / 2)
        const y = rect.top + (rect.height / 2)
        elems.push(context.elementFromPoint(x, y))

        return elems
    }

    // get overlapping elements
    function getOverlappingElements (elem: Element, context?: Document | ShadowRoot) {
        return [getOverlappingElement(elem, context)].concat(getOverlappingRects(elem, context)) as Element[]
    }

    // is a node a descendant of a given node
    function nodeContains (elem: Element, otherNode: Element) {
        // Edge doesn't support neither Shadow Dom nor contains if ShadowRoot polyfill is used
        if (isOldEdge) {
            let tmpElement: Element = otherNode
            while (tmpElement) {
                if (tmpElement === elem) {
                    return true
                }

                const shadowElement = tmpElement.parentNode as ShadowRoot
                // DocumentFragment / ShadowRoot polyfill like ShadyRoot
                if (shadowElement && shadowElement.nodeType === 11 && shadowElement.host) {
                    tmpElement = shadowElement.host
                }
            }
            return false
        }

        return elem.contains(otherNode)
    }

    // is one of overlapping elements the `elem` or one of its child
    function isOverlappingElementMatch (
        elementsFromPoint: Element[],
        elem: Element
    ): boolean {
        if (elementsFromPoint.some(function (elementFromPoint) {
            return elementFromPoint === elem || nodeContains(elem, elementFromPoint)
        })) {
            return true
        }

        // shadow root
        // filter unique elements with shadowRoot
        let elemsWithShadowRoot: Element[] = [...elementsFromPoint]
        elemsWithShadowRoot = elemsWithShadowRoot.filter(function (x) {
            return x && x.shadowRoot && x.shadowRoot.elementFromPoint
        })

        // getOverlappingElements of every element with shadowRoot
        let shadowElementsFromPoint: Element[] = []
        for (let i = 0; i < elemsWithShadowRoot.length; ++i) {
            let shadowElement: Element = elemsWithShadowRoot[i]
            shadowElementsFromPoint = shadowElementsFromPoint.concat(
                getOverlappingElements(
                    elem,
                    shadowElement.shadowRoot as ShadowRoot
                ) as ConcatArray<Element>
            )
        }
        // remove duplicates and parents
        shadowElementsFromPoint = [...shadowElementsFromPoint]
        shadowElementsFromPoint = shadowElementsFromPoint.filter(function (x) {
            return !elementsFromPoint.includes(x)
        })

        if (shadowElementsFromPoint.length === 0) {
            return false
        }

        return isOverlappingElementMatch(shadowElementsFromPoint, elem)
    }

    // copied from `isElementInViewport.js`
    function isElementInViewport (elem: Element) {
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

    function isClickable (elem: Element) {
        return (
            isElementInViewport(elem) && (elem as any).disabled !== true &&
            isOverlappingElementMatch(getOverlappingElements(elem), elem)
        )
    }

    // scroll to the element if it's not clickable
    if (!isClickable(elem)) {
        // works well in dialogs, but the element may be still overlapped by some sticky header/footer
        elem.scrollIntoView(scrollIntoViewFullSupport ? { block: 'nearest', inline: 'nearest' } : false)

        // if element is still not clickable take another scroll attempt
        if (!isClickable(elem)) {
            // scroll to element, try put it in the screen center.
            // Should definitely work even if element was covered with sticky header/footer
            elem.scrollIntoView(scrollIntoViewFullSupport ? { block: 'center', inline: 'center' } : true)

            return isClickable(elem)
        }
    }

    return true
}
