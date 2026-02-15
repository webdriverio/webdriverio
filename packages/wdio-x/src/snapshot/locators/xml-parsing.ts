/**
 * XML parsing utilities for mobile element source
 */

import { DOMParser } from '@xmldom/xmldom'
import xpath from 'xpath'
import type { ElementAttributes, JSONElement, Bounds, UniquenessResult } from './types.js'

/**
 * Get child nodes that are elements (not text nodes, comments, etc.)
 */
function childNodesOf(node: Node): Node[] {
    const children: Node[] = []
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes.item(i)
            if (child?.nodeType === 1) {
                children.push(child)
            }
        }
    }
    return children
}

/**
 * Recursively translate DOM node to JSONElement
 */
function translateRecursively(
    domNode: Node,
    parentPath: string = '',
    index: number | null = null,
): JSONElement {
    const attributes: ElementAttributes = {}

    const element = domNode as Element
    if (element.attributes) {
        for (let attrIdx = 0; attrIdx < element.attributes.length; attrIdx++) {
            const attr = element.attributes.item(attrIdx)
            if (attr) {
                attributes[attr.name] = attr.value.replace(/(\n)/gm, '\\n')
            }
        }
    }

    const path = index === null ? '' : `${parentPath ? parentPath + '.' : ''}${index}`

    return {
        children: childNodesOf(domNode).map((childNode, childIndex) =>
            translateRecursively(childNode, path, childIndex),
        ),
        tagName: domNode.nodeName,
        attributes,
        path,
    }
}

/**
 * Compare two nodes for equality by platform-specific attributes
 * (reference equality via === may fail when nodes come from different traversals)
 */
function isSameElement(node1: Node, node2: Node): boolean {
    if (node1.nodeType !== 1 || node2.nodeType !== 1) {
        return false
    }
    const el1 = node1 as Element
    const el2 = node2 as Element

    if (el1.nodeName !== el2.nodeName) {
        return false
    }

    // For Android, compare by bounds (unique per element)
    const bounds1 = el1.getAttribute('bounds')
    const bounds2 = el2.getAttribute('bounds')
    if (bounds1 && bounds2) {
        return bounds1 === bounds2
    }

    // For iOS, compare by x, y, width, height
    const x1 = el1.getAttribute('x')
    const y1 = el1.getAttribute('y')
    const x2 = el2.getAttribute('x')
    const y2 = el2.getAttribute('y')
    if (x1 && y1 && x2 && y2) {
        return (
            x1 === x2 &&
            y1 === y2 &&
            el1.getAttribute('width') === el2.getAttribute('width') &&
            el1.getAttribute('height') === el2.getAttribute('height')
        )
    }

    return false
}

/**
 * Convert XML page source to JSON tree structure
 */
export function xmlToJSON(sourceXML: string): JSONElement | null {
    try {
        const parser = new DOMParser()
        const sourceDoc = parser.parseFromString(sourceXML, 'text/xml')

        const parseErrors = sourceDoc.getElementsByTagName('parsererror')
        if (parseErrors.length > 0) {
            console.error('[xmlToJSON] XML parsing error:', parseErrors[0].textContent)
            return null
        }

        // xmldom Document/Element types are structurally compatible but don't extend global DOM types
        const children = childNodesOf(sourceDoc as unknown as Node)
        const firstChild =
            children[0] ||
            (sourceDoc.documentElement ? childNodesOf(sourceDoc.documentElement as unknown as Node)[0] : null)

        return firstChild
            ? translateRecursively(firstChild)
            : { children: [], tagName: '', attributes: {}, path: '' }
    } catch (e) {
        console.error('[xmlToJSON] Failed to parse XML:', e)
        return null
    }
}

/**
 * Parse XML source to DOM Document for XPath evaluation
 */
export function xmlToDOM(sourceXML: string): Document | null {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(sourceXML, 'text/xml')

        const parseErrors = doc.getElementsByTagName('parsererror')
        if (parseErrors.length > 0) {
            console.error('[xmlToDOM] XML parsing error:', parseErrors[0].textContent)
            return null
        }

        // xmldom Document is structurally compatible but doesn't extend global DOM Document
        return doc as unknown as Document
    } catch (e) {
        console.error('[xmlToDOM] Failed to parse XML:', e)
        return null
    }
}

/**
 * Execute XPath query on DOM document
 */
export function evaluateXPath(doc: Document, xpathExpr: string): Node[] {
    try {
        const nodes = xpath.select(xpathExpr, doc)
        if (Array.isArray(nodes)) {
            return nodes as Node[]
        }
        return []
    } catch (e) {
        console.error(`[evaluateXPath] Failed to evaluate "${xpathExpr}":`, e)
        return []
    }
}

/**
 * Check if an XPath selector is unique and get index if not
 */
export function checkXPathUniqueness(
    doc: Document,
    xpathExpr: string,
    targetNode?: Node,
): UniquenessResult {
    try {
        const nodes = evaluateXPath(doc, xpathExpr)
        const totalMatches = nodes.length

        if (totalMatches === 0) {
            return { isUnique: false }
        }

        if (totalMatches === 1) {
            return { isUnique: true }
        }

        // Not unique - find index of target node if provided
        if (targetNode) {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] === targetNode || isSameElement(nodes[i], targetNode)) {
                    return {
                        isUnique: false,
                        index: i + 1, // 1-based index for XPath
                        totalMatches,
                    }
                }
            }
        }

        return { isUnique: false, totalMatches }
    } catch (e) {
        console.error(`[checkXPathUniqueness] Error checking "${xpathExpr}":`, e)
        return { isUnique: false }
    }
}

/**
 * Find DOM node by JSONElement path (e.g., "0.2.1")
 */
export function findDOMNodeByPath(doc: Document, path: string): Node | null {
    if (!path) {
        return doc.documentElement
    }

    const indices = path.split('.').map(Number)
    let current: Node | null = doc.documentElement

    for (const index of indices) {
        if (!current) {
            return null
        }

        const children: Node[] = []
        if (current.childNodes) {
            for (let i = 0; i < current.childNodes.length; i++) {
                const child = current.childNodes.item(i)
                if (child?.nodeType === 1) {
                    children.push(child)
                }
            }
        }

        current = children[index] || null
    }

    return current
}

/**
 * Parse Android bounds string "[x1,y1][x2,y2]" to coordinates
 */
export function parseAndroidBounds(bounds: string): Bounds {
    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)
    if (!match) {
        return { x: 0, y: 0, width: 0, height: 0 }
    }

    const x1 = parseInt(match[1], 10)
    const y1 = parseInt(match[2], 10)
    const x2 = parseInt(match[3], 10)
    const y2 = parseInt(match[4], 10)

    return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
    }
}

/**
 * Parse iOS element bounds from individual x, y, width, height attributes
 */
export function parseIOSBounds(attributes: ElementAttributes): Bounds {
    return {
        x: parseInt(attributes.x || '0', 10),
        y: parseInt(attributes.y || '0', 10),
        width: parseInt(attributes.width || '0', 10),
        height: parseInt(attributes.height || '0', 10),
    }
}

/**
 * Flatten JSON element tree to array (depth-first)
 */
export function flattenElementTree(root: JSONElement): JSONElement[] {
    const result: JSONElement[] = []

    function traverse(element: JSONElement) {
        result.push(element)
        for (const child of element.children) {
            traverse(child)
        }
    }

    traverse(root)
    return result
}

/**
 * Count occurrences of an attribute value in the source XML
 */
export function countAttributeOccurrences(
    sourceXML: string,
    attribute: string,
    value: string,
): number {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`${attribute}=["']${escapedValue}["']`, 'g')
    const matches = sourceXML.match(pattern)
    return matches ? matches.length : 0
}

/**
 * Check if an attribute value is unique in the source (fast regex-based check)
 */
export function isAttributeUnique(
    sourceXML: string,
    attribute: string,
    value: string,
): boolean {
    return countAttributeOccurrences(sourceXML, attribute, value) === 1
}
