import type { XPathConversionResult, XPathCondition } from './xpath-types.js'
import type { XPathSegment } from './xpath-parser.js'
import { parseXPathToSegments } from './xpath-parser.js'
import { convertConditionToPredicate } from './xpath-conditions.js'

/**
 * Converts a single XPathCondition to class chain predicate syntax.
 */
function conditionToClassChainPredicate(condition: XPathCondition): string {
    return convertConditionToPredicate(condition, 'double')
}

/**
 * Groups conditions and converts them to class chain predicate string.
 * Handles OR conditions by grouping them together.
 */
function conditionsToClassChainPredicate(conditions: XPathCondition[]): string {
    if (conditions.length === 0) {
        return ''
    }

    const result: string[] = []
    const orGroups: { [key: string]: string[] } = {}
    const regularConditions: string[] = []

    for (const condition of conditions) {
        const predicate = conditionToClassChainPredicate(condition)
        if (condition.logicalOp === 'OR') {
            if (!orGroups[condition.attribute]) {
                orGroups[condition.attribute] = []
            }
            orGroups[condition.attribute].push(predicate)
        } else {
            regularConditions.push(predicate)
        }
    }

    // Add grouped OR conditions
    for (const [, values] of Object.entries(orGroups)) {
        if (values.length > 1) {
            result.push(`(${values.join(' OR ')})`)
        } else {
            result.push(values[0])
        }
    }

    // Add regular conditions
    result.push(...regularConditions)

    return result.join(' AND ')
}

/**
 * Converts a single XPathSegment to class chain syntax.
 */
function segmentToClassChain(segment: XPathSegment): string {
    let chain = ''

    chain += segment.axis === '//' ? '**/' : '/'
    chain += segment.element

    if (segment.conditions.length > 0) {
        const predicateStr = conditionsToClassChainPredicate(segment.conditions)
        if (predicateStr) {
            chain += `[\`${predicateStr}\`]`
        }
    }

    if (segment.index !== undefined && segment.index > 0) {
        chain += `[${segment.index}]`
    }

    return chain
}

/**
 * Attempts to convert XPath to iOS Class Chain.
 * Handles hierarchy traversal and element filtering.
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with class chain selector, or null if not applicable
 */
export function convertXPathToClassChain(xpath: string): XPathConversionResult | null {
    const segments = parseXPathToSegments(xpath)

    if (segments && segments.length > 0) {
        const chainParts: string[] = []

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]
            const segmentChain = segmentToClassChain(segment)

            if (i === 0) {
                chainParts.push(segmentChain)
            } else if (segmentChain.startsWith('**/')) {
                chainParts.push(segmentChain)
            } else if (segmentChain.startsWith('/')) {
                chainParts.push(segmentChain.slice(1))
            }
        }

        let finalChain = ''
        for (let i = 0; i < chainParts.length; i++) {
            if (i === 0) {
                finalChain = chainParts[i]
            } else {
                const part = chainParts[i]
                finalChain += '/' + part
            }
        }

        if (/\[last\(\)\]$/i.test(xpath)) {
            finalChain += '[last()]'
        }

        return {
            selector: `-ios class chain:${finalChain}`
        }
    }

    return null
}
