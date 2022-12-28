/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * check if element is visible
 * @param  {HTMLElement} elem  element to check
 * @return {Boolean}           true if element is within viewport
 */
export default function isElementDisplayed (element: Element): boolean {
    function nodeIsElement(node?: Element) {
        if (!node) {
            return false
        }

        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
        case Node.DOCUMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
            return true

        default:
            return false
        }
    }

    function parentElementForElement(element?: Element) {
        if (!element) {
            return null
        }

        return enclosingNodeOrSelfMatchingPredicate(element.parentNode as ParentNode, nodeIsElement)
    }

    function enclosingNodeOrSelfMatchingPredicate(targetNode: ParentNode | HTMLElement, predicate: Function) {
        for (
            let node: ParentNode = targetNode;
            node && node !== (targetNode as Node).ownerDocument;
            node = (node as HTMLElement).parentNode as ParentNode
        ) {
            if (predicate(node)) {
                return node
            }
        }

        return null
    }

    function enclosingElementOrSelfMatchingPredicate(targetElement: HTMLElement | Document, predicate: Function) {
        for (
            let element: HTMLElement | ParentNode = targetElement;
            element && element !== targetElement.ownerDocument;
            element = parentElementForElement(element as HTMLElement) as HTMLElement
        ) {
            if (predicate(element)) {
                return element
            }
        }

        return null
    }

    function cascadedStylePropertyForElement(
        element?: Element | ParentNode | ShadowRoot,
        property?: string
    ): string | null {
        if (!element || !property) {
            return null
        }
        // if document-fragment, skip it and use element.host instead. This happens
        // when the element is inside a shadow root.
        // window.getComputedStyle errors on document-fragment.
        if (element instanceof window.ShadowRoot) {
            element = element.host
        }

        const computedStyle = window.getComputedStyle(element as Element)
        const computedStyleProperty = computedStyle.getPropertyValue(property)
        if (computedStyleProperty && computedStyleProperty !== 'inherit') {
            return computedStyleProperty
        }

        // Ideally getPropertyValue would return the 'used' or 'actual' value, but
        // it doesn't for legacy reasons. So we need to do our own poor man's cascade.
        // Fall back to the first non-'inherit' value found in an ancestor.
        // In any case, getPropertyValue will not return 'initial'.

        // FIXME: will this incorrectly inherit non-inheritable CSS properties?
        // I think all important non-inheritable properties (width, height, etc.)
        // for our purposes here are specially resolved, so this may not be an issue.
        // Specification is here: https://drafts.csswg.org/cssom/#resolved-values
        const parentElement = parentElementForElement(element as Element) as ParentNode
        return cascadedStylePropertyForElement(parentElement, property)
    }

    function elementSubtreeHasNonZeroDimensions(element: Element): boolean {
        const boundingBox = element.getBoundingClientRect()
        if (boundingBox.width > 0 && boundingBox.height > 0) {
            return true
        }

        // Paths can have a zero width or height. Treat them as shown if the stroke width is positive.
        if (element.tagName.toUpperCase() === 'PATH' && boundingBox.width + boundingBox.height > 0) {
            const strokeWidth = cascadedStylePropertyForElement(element, 'stroke-width')
            return !!strokeWidth && (parseInt(strokeWidth, 10) > 0)
        }

        const cascadedOverflow = cascadedStylePropertyForElement(element, 'overflow')
        if (cascadedOverflow === 'hidden') {
            return false
        }

        // If the container's overflow is not hidden and it has zero size, consider the
        // container to have non-zero dimensions if a child node has non-zero dimensions.
        return Array.from(element.childNodes).some((childNode: Element) => {
            if (childNode.nodeType === Node.TEXT_NODE) {
                return true
            }

            if (nodeIsElement(childNode)) {
                return elementSubtreeHasNonZeroDimensions(childNode)
            }

            return false
        })
    }

    function elementOverflowsContainer(element: Element) {
        const cascadedOverflow = cascadedStylePropertyForElement(element, 'overflow')
        if (cascadedOverflow !== 'hidden') {
            return false
        }

        // FIXME: this needs to take into account the scroll position of the element,
        // the display modes of it and its ancestors, and the container it overflows.
        // See Selenium's bot.dom.getOverflowState atom for an exhaustive list of edge cases.
        return true
    }

    function isElementSubtreeHiddenByOverflow (element: Element): boolean {
        if (!element) {
            return false
        }

        if (!elementOverflowsContainer(element)) {
            return false
        }

        if (!element.childNodes.length) {
            return false
        }

        // This element's subtree is hidden by overflow if all child subtrees are as well.
        return Array.from(element.childNodes).every((childNode: Element) => {
            // Returns true if the child node is overflowed or otherwise hidden.
            // Base case: not an element, has zero size, scrolled out, or doesn't overflow container.
            // Visibility of text nodes is controlled by parent
            if (childNode.nodeType === Node.TEXT_NODE) {
                return false
            }
            if (!nodeIsElement(childNode)) {
                return true
            }

            if (!elementSubtreeHasNonZeroDimensions(childNode)) {
                return true
            }

            // Recurse.
            return isElementSubtreeHiddenByOverflow(childNode)
        })
    }
    // walk up the tree testing for a shadow root
    function isElementInsideShadowRoot (element: Element): boolean {
        if (!element) {
            return false
        }
        if (element.parentNode && (element.parentNode as ShadowRoot).host) {
            return true
        }
        return isElementInsideShadowRoot(element.parentNode as Element)
    }

    // This is a partial reimplementation of Selenium's "element is displayed" algorithm.
    // When the W3C specification's algorithm stabilizes, we should implement that.
    // If this command is misdirected to the wrong document (and is NOT inside a shadow root), treat it as not shown.
    if (!isElementInsideShadowRoot(element) && !document.contains(element)) {
        return false
    }

    // Special cases for specific tag names.
    switch (element.tagName.toUpperCase()) {
    case 'BODY':
        return true

    case 'SCRIPT':
    case 'NOSCRIPT':
        return false

    case 'OPTGROUP':
    case 'OPTION': {
        // Option/optgroup are considered shown if the containing <select> is shown.
        const enclosingSelectElement = enclosingNodeOrSelfMatchingPredicate(element, (e: Element) => e.tagName.toUpperCase() === 'SELECT')
        return isElementDisplayed(enclosingSelectElement as Element)
    }
    case 'INPUT':
        // <input type="hidden"> is considered not shown.
        if ((element as HTMLInputElement).type === 'hidden') {
            return false
        }
        break
        // case 'MAP':
        // FIXME: Selenium has special handling for <map> elements. We don't do anything now.

    default:
        break
    }

    if (cascadedStylePropertyForElement(element, 'visibility') !== 'visible') {
        return false
    }

    const hasAncestorWithZeroOpacity = !!enclosingElementOrSelfMatchingPredicate(element as HTMLElement, (e: Element) => {
        return Number(cascadedStylePropertyForElement(e, 'opacity')) === 0
    })
    const hasAncestorWithDisplayNone = !!enclosingElementOrSelfMatchingPredicate(element as HTMLElement, (e: Element) => {
        return cascadedStylePropertyForElement(e, 'display') === 'none'
    })
    if (hasAncestorWithZeroOpacity || hasAncestorWithDisplayNone) {
        return false
    }

    if (!elementSubtreeHasNonZeroDimensions(element)) {
        return false
    }

    if (isElementSubtreeHiddenByOverflow(element)) {
        return false
    }

    return true
}
