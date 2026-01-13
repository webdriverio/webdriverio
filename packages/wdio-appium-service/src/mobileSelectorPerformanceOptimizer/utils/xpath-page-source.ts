/**
 * Functions for parsing page source XML and extracting element data.
 */

import logger from '@wdio/logger'

import type { ElementData, PredicateCondition } from './xpath-types.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Parses page source XML to extract element data based on the original XPath.
 * Finds the specific element that matches the XPath criteria.
 *
 * @param pageSource - The page source XML
 * @param xpath - The original XPath selector used to find the element
 * @returns Element data if found, null otherwise
 */
export function parseElementFromPageSource(pageSource: string, xpath: string): ElementData | null {
    // Extract element type from XPath (e.g., XCUIElementTypeButton)
    const elementTypeMatch = xpath.match(/\/\/XCUIElementType(\w+)/)
    const expectedElementType = elementTypeMatch ? `XCUIElementType${elementTypeMatch[1]}` : null

    // Extract attribute conditions from XPath
    const { attributeConditions, orConditions } = extractAttributeConditionsFromXPath(xpath)

    // Find matching element in page source
    const elementPattern = /<(\w+)([^>]*)>/g
    let match: RegExpExecArray | null

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const tagName = match[1]
        const attrs = match[2]

        // Check if element type matches (if specified in XPath)
        if (expectedElementType && tagName !== expectedElementType) {
            continue
        }

        // Extract all attributes from this element
        const elementAttrs = extractElementAttributes(attrs)

        // Check if element matches all conditions
        if (matchesAllConditions(elementAttrs, attributeConditions, orConditions)) {
            return {
                type: tagName,
                attributes: elementAttrs
            }
        }
    }

    // Fallback: try to find element by first attribute condition
    return findElementByFirstCondition(pageSource, attributeConditions, orConditions, expectedElementType)
}

/**
 * Extracts attribute conditions from XPath expression.
 */
function extractAttributeConditionsFromXPath(xpath: string): {
    attributeConditions: Record<string, string[]>
    orConditions: Record<string, string[]>
} {
    const attributeConditions: Record<string, string[]> = {}
    const orConditions: Record<string, string[]> = {}

    // Extract OR conditions first (e.g., @name="Allow" or @name="OK")
    const orPattern = /@(\w+)\s*=\s*["']([^"']+)["']\s+or\s+@(\w+)\s*=\s*["']([^"']+)["']/gi
    let orMatch: RegExpExecArray | null
    while ((orMatch = orPattern.exec(xpath)) !== null) {
        if (orMatch[1] === orMatch[3]) {
            if (!orConditions[orMatch[1]]) {
                orConditions[orMatch[1]] = []
            }
            if (!orConditions[orMatch[1]].includes(orMatch[2])) {
                orConditions[orMatch[1]].push(orMatch[2])
            }
            if (!orConditions[orMatch[1]].includes(orMatch[4])) {
                orConditions[orMatch[1]].push(orMatch[4])
            }
        }
    }

    // Extract regular conditions (excluding those already in OR conditions)
    const attrPattern = /@(\w+)\s*=\s*["']([^"']+)["']/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrPattern.exec(xpath)) !== null) {
        if (!orConditions[attrMatch[1]]) {
            if (!attributeConditions[attrMatch[1]]) {
                attributeConditions[attrMatch[1]] = []
            }
            if (!attributeConditions[attrMatch[1]].includes(attrMatch[2])) {
                attributeConditions[attrMatch[1]].push(attrMatch[2])
            }
        }
    }

    return { attributeConditions, orConditions }
}

/**
 * Extracts attributes from an element tag.
 */
function extractElementAttributes(attrs: string): Record<string, string> {
    const elementAttrs: Record<string, string> = {}
    const attrMatches = attrs.matchAll(/(\w+)="([^"]*)"/g)
    for (const attrMatch of attrMatches) {
        elementAttrs[attrMatch[1]] = attrMatch[2]
    }
    return elementAttrs
}

/**
 * Checks if element attributes match all conditions.
 */
function matchesAllConditions(
    elementAttrs: Record<string, string>,
    attributeConditions: Record<string, string[]>,
    orConditions: Record<string, string[]>
): boolean {
    // Check regular conditions (AND logic - all must match)
    for (const [attr, values] of Object.entries(attributeConditions)) {
        const elementValue = elementAttrs[attr]
        if (!elementValue || !values.includes(elementValue)) {
            return false
        }
    }

    // Check OR conditions (OR logic - at least one must match)
    for (const [attr, values] of Object.entries(orConditions)) {
        const elementValue = elementAttrs[attr]
        if (!elementValue || !values.includes(elementValue)) {
            return false
        }
    }

    // If no specific conditions, but XPath has wildcard, accept any element with name/label
    if (Object.keys(attributeConditions).length === 0 && Object.keys(orConditions).length === 0) {
        if (!elementAttrs.name && !elementAttrs.label) {
            return false
        }
    }

    return true
}

/**
 * Fallback: find element by first attribute condition.
 */
function findElementByFirstCondition(
    pageSource: string,
    attributeConditions: Record<string, string[]>,
    orConditions: Record<string, string[]>,
    expectedElementType: string | null
): ElementData | null {
    const allConditions = { ...attributeConditions, ...orConditions }
    if (Object.keys(allConditions).length === 0) {
        return null
    }

    const firstAttr = Object.keys(allConditions)[0]
    const firstValues = allConditions[firstAttr]
    const elementPattern = /<(\w+)([^>]*)>/g
    let match: RegExpExecArray | null

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const tagName = match[1]
        const attrs = match[2]

        if (expectedElementType && tagName !== expectedElementType) {
            continue
        }

        const elementAttrs = extractElementAttributes(attrs)
        const elementValue = elementAttrs[firstAttr]
        if (elementValue && firstValues.includes(elementValue)) {
            return {
                type: tagName,
                attributes: elementAttrs
            }
        }
    }

    return null
}

/**
 * Tests if a selector matches exactly one element by parsing the page source XML.
 *
 * @param selector - The selector to test
 * @param pageSource - The page source XML to search in
 * @returns True if exactly one element matches the selector
 */
export function isSelectorUniqueInPageSource(selector: string, pageSource: string): boolean {
    try {
        if (selector.startsWith('~')) {
            return isAccessibilityIdUnique(selector.substring(1), pageSource)
        } else if (selector.startsWith('-ios predicate string:')) {
            const predicateString = selector.substring('-ios predicate string:'.length)
            return countMatchingElementsByPredicate(predicateString, pageSource) === 1
        } else if (selector.startsWith('-ios class chain:')) {
            const chainString = selector.substring('-ios class chain:'.length)
            return countMatchingElementsByClassChain(chainString, pageSource) === 1
        }
        return false
    } catch (error) {
        log.debug(`Selector uniqueness check failed: ${error instanceof Error ? error.message : String(error)}`)
        return false
    }
}

/**
 * Checks if an accessibility ID is unique in page source.
 */
function isAccessibilityIdUnique(value: string, pageSource: string): boolean {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const namePattern = new RegExp(`<\\w+[^>]*\\s+name="${escapedValue}"[^>]*>`, 'gi')
    const labelPattern = new RegExp(`<\\w+[^>]*\\s+label="${escapedValue}"[^>]*>`, 'gi')
    const nameMatches = pageSource.match(namePattern) || []
    const labelMatches = pageSource.match(labelPattern) || []
    const allMatches = new Set([...nameMatches, ...labelMatches])
    return allMatches.size === 1
}

/**
 * Counts elements matching a predicate string by parsing page source XML.
 */
export function countMatchingElementsByPredicate(predicateString: string, pageSource: string): number {
    const conditions = parsePredicateConditions(predicateString)
    const typeMatch = predicateString.match(/type\s*==\s*'([^']+)'/)
    const elementType = typeMatch ? typeMatch[1] : null

    const elementPattern = elementType
        ? new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')
        : /<(\w+)([^>]*)>/gi

    let match: RegExpExecArray | null
    let count = 0

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const attrs = match[1] || match[2] || ''

        if (elementType && !match[0].includes(`<${elementType}`)) {
            continue
        }

        if (matchesPredicateConditions(attrs, conditions)) {
            count++
        }
    }

    return count
}

/**
 * Parses predicate string conditions.
 */
function parsePredicateConditions(predicateString: string): PredicateCondition[] {
    const conditions: PredicateCondition[] = []
    const attrPattern = /(\w+)\s*==\s*'([^']+)'/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrPattern.exec(predicateString)) !== null) {
        if (attrMatch[1] !== 'type') {
            conditions.push({ attr: attrMatch[1], op: '==', value: attrMatch[2] })
        }
    }
    return conditions
}

/**
 * Checks if element attributes match predicate conditions.
 */
function matchesPredicateConditions(attrs: string, conditions: PredicateCondition[]): boolean {
    for (const condition of conditions) {
        const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
        const attrMatch = attrs.match(attrPattern)
        if (!attrMatch || attrMatch[1] !== condition.value) {
            return false
        }
    }
    return true
}

/**
 * Counts elements matching a class chain by parsing page source XML.
 */
export function countMatchingElementsByClassChain(chainString: string, pageSource: string): number {
    const typeMatch = chainString.match(/^\*\*\/(\w+)/)
    const elementType = typeMatch ? typeMatch[1] : null

    if (!elementType) {
        return 0
    }

    const predicateMatch = chainString.match(/\[`([^`]+)`\]/)
    const conditions: PredicateCondition[] = []

    if (predicateMatch) {
        const predicateContent = predicateMatch[1]
        const attrPattern = /(\w+)\s*==\s*"([^"]+)"/g
        let attrMatch: RegExpExecArray | null
        while ((attrMatch = attrPattern.exec(predicateContent)) !== null) {
            conditions.push({ attr: attrMatch[1], op: '==', value: attrMatch[2] })
        }
    }

    const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')

    let match: RegExpExecArray | null
    let count = 0

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const attrs = match[1] || ''

        let matches = true
        for (const condition of conditions) {
            const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
            const attrMatch = attrs.match(attrPattern)
            if (!attrMatch || attrMatch[1] !== condition.value) {
                matches = false
                break
            }
        }

        if (matches) {
            count++
        }
    }

    return count
}
