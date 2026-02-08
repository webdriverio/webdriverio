/**
 * Functions for executing XPath expressions against page source XML.
 * Used as a fallback for unmappable XPath features (sibling axes, parent traversal, etc.)
 */

import { DOMParser } from '@xmldom/xmldom'
import xpath from 'xpath'

import logger from '@wdio/logger'

import type { ElementData } from './xpath-types.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Result of finding an element by XPath with match count for uniqueness validation
 */
export interface XPathExecutionResult {
    element: ElementData
    matchCount: number
}

/**
 * Executes an XPath expression against page source XML and returns matching elements.
 *
 * @param xpathExpr - The XPath expression to execute
 * @param pageSource - The page source XML
 * @returns Array of ElementData for matching elements, or null if execution failed
 */
export function executeXPathOnPageSource(xpathExpr: string, pageSource: string): ElementData[] | null {
    if (!pageSource || !xpathExpr) {
        return null
    }

    try {
        const doc = new DOMParser().parseFromString(pageSource, 'text/xml')
        const parseErrors = doc.getElementsByTagName('parsererror')
        if (parseErrors.length > 0) {
            log.debug('XML parsing error in page source')
            return null
        }

        const nodes = xpath.select(xpathExpr, doc as unknown as Node)

        if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
            return []
        }

        const elements: ElementData[] = []

        for (const node of nodes) {
            // Ensure node is an Element
            if (node && typeof node === 'object' && 'nodeName' in node && 'attributes' in node) {
                const elementNode = node as Element
                const attributes: Record<string, string> = {}

                if (elementNode.attributes) {
                    for (let i = 0; i < elementNode.attributes.length; i++) {
                        const attr = elementNode.attributes[i]
                        if (attr && attr.name && attr.value !== undefined) {
                            attributes[attr.name] = attr.value
                        }
                    }
                }

                elements.push({
                    type: elementNode.nodeName,
                    attributes
                })
            }
        }

        return elements
    } catch (error) {
        log.debug(`XPath execution failed: ${error instanceof Error ? error.message : String(error)}`)
        return null
    }
}

/**
 * Finds an element by executing XPath against page source and returns element data with match count.
 * Used for unmappable XPath fallback with uniqueness validation.
 *
 * @param xpathExpr - The XPath expression to execute
 * @param pageSource - The page source XML
 * @returns XPathExecutionResult with first matching element and total match count, or null if not found
 */
export function findElementByXPathWithFallback(xpathExpr: string, pageSource: string): XPathExecutionResult | null {
    const elements = executeXPathOnPageSource(xpathExpr, pageSource)

    if (!elements || elements.length === 0) {
        return null
    }

    return {
        element: elements[0],
        matchCount: elements.length
    }
}
