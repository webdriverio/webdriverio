/**
 * check if element is within the viewport or is overlapped by another element or disabled
 * @param  {HTMLElement} elem  element to check
 * @return {Boolean}           false if element is not overlapped
 */
export default function isElementClickable (elem: HTMLElement) {
    if (!elem.getBoundingClientRect || !elem.scrollIntoView || !elem.contains || !elem.getClientRects || !document.elementFromPoint) {
        return false
    }

    // Edge before switching to Chromium
    const isOldEdge = !!(window as any).StyleMedia
    // returns true for Chrome and Firefox and false for Safari, Edge and IE
    const scrollIntoViewFullSupport = !((window as any).safari || isOldEdge)

    // get overlapping element
    function getOverlappingElement (elem: HTMLElement, context?: Document) {
        context = context || document
        const elemDimension = elem.getBoundingClientRect()
        const x = elemDimension.left + (elem.clientWidth / 2)
        const y = elemDimension.top + (elem.clientHeight / 2)
        return context.elementFromPoint(x, y)
    }

    // get overlapping element rects (currently only the first)
    // applicable if element's text is multiline.
    function getOverlappingRects (elem: HTMLElement, context?: Document) {
        context = context || document

        const rects = elem.getClientRects()
        // webdriver clicks on center of the first element's rect (line of text), it might change in future
        const rect = rects[0]
        const x = rect.left + (rect.width / 2)
        const y = rect.top + (rect.height / 2)
        return [context.elementFromPoint(x, y)]
    }

    // get overlapping elements
    function getOverlappingElements (elem: HTMLElement, context?: Document) {
        return [getOverlappingElement(elem, context)].concat(getOverlappingRects(elem, context))
    }

    // is a node a descendant of a given node
    function nodeContains (elem: HTMLElement, otherNode: HTMLElement) {
        // Edge doesn't support neither Shadow Dom nor contains if ShadowRoot polyfill is used
        if (isOldEdge) {
            let tmpElement = otherNode as HTMLElement | ShadowRoot | Element
            while (tmpElement) {
                if (tmpElement === elem) {
                    return true
                }

                tmpElement = tmpElement.parentNode as ShadowRoot
                // DocumentFragment / ShadowRoot polyfill like ShadyRoot
                if (tmpElement && tmpElement.nodeType === 11 && tmpElement.host) {
                    tmpElement = tmpElement.host
                }
            }
            return false
        }

        return elem.contains(otherNode)
    }

    // is one of overlapping elements the `elem` or one of its child
    function isOverlappingElementMatch (elementsFromPoint: HTMLElement[], elem: HTMLElement): boolean {
        if (elementsFromPoint.some(function (elementFromPoint) {
            return elementFromPoint === elem || nodeContains(elem, elementFromPoint)
        })) {
            return true
        }

        // shadow root
        // filter unique elements with shadowRoot
        // @ts-ignore
        let elemsWithShadowRoot = [].concat(elementsFromPoint)
        elemsWithShadowRoot = elemsWithShadowRoot.filter(function (x: HTMLElement) {
            return x && x.shadowRoot && (x.shadowRoot as any).elementFromPoint
        })

        // getOverlappingElements of every element with shadowRoot
        let shadowElementsFromPoint: HTMLElement[] = []
        for (let i = 0; i < elemsWithShadowRoot.length; ++i) {
            const shadowElement = elemsWithShadowRoot[i]
            shadowElementsFromPoint = shadowElementsFromPoint.concat(
                getOverlappingElements(elem, (shadowElement as HTMLElement).shadowRoot as any) as any
            )
        }
        // remove duplicates and parents
        // @ts-ignore
        shadowElementsFromPoint = [].concat(shadowElementsFromPoint)
        shadowElementsFromPoint = shadowElementsFromPoint.filter(function (x) {
            return !elementsFromPoint.includes(x)
        })

        if (shadowElementsFromPoint.length === 0) {
            return false
        }

        return isOverlappingElementMatch(shadowElementsFromPoint, elem)
    }

    // copied from `isElementInViewport.js`
    function isElementInViewport (elem: HTMLElement) {
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

    function isEnabled(elem: HTMLFormElement) {
        return elem.disabled !== true
    }

    function hasOverlaps(elem: HTMLElement) {
        return !isOverlappingElementMatch(getOverlappingElements(elem) as any as HTMLElement[], elem)
    }

    function isFullyDisplayedInViewport(elem: HTMLElement) {
        return isElementInViewport(elem) && !hasOverlaps(elem)
    }

    // scroll the element to the center of the viewport when
    // it is not fully displayed in the viewport or is overlapped by another element
    // to check if it still overlapped/not in the viewport
    // afterwards we scroll back to the original position
    let _isFullyDisplayedInViewport = isFullyDisplayedInViewport(elem)
    if (!_isFullyDisplayedInViewport) {
        const { x: originalX, y: originalY } = elem.getBoundingClientRect()

        elem.scrollIntoView(scrollIntoViewFullSupport ? { block: 'center', inline: 'center' } : false)

        _isFullyDisplayedInViewport = isFullyDisplayedInViewport(elem)

        const { x, y } = elem.getBoundingClientRect()
        if (x !== originalX || y !== originalY) {
            elem.scroll(scrollX, scrollY)
        }
    }

    return _isFullyDisplayedInViewport && isEnabled(elem as HTMLFormElement)
}
