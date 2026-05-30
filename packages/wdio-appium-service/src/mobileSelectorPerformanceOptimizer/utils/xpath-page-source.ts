/**
 * Functions for validating selector uniqueness in page source XML.
 */

import logger from '@wdio/logger'

import type { PredicateCondition } from './xpath-types.js'

const log = logger('@wdio/appium-service:selector-optimizer')

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
