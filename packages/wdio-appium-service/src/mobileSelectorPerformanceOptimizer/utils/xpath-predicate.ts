import type { XPathConversionResult } from './xpath-types.js'
import { extractXPathConditions, groupOrConditions } from './xpath-conditions.js'
import { extractElementTypeFromXPath } from './xpath-detection.js'

/**
 * Attempts to convert XPath to iOS Predicate String.
 * Handles common XPath patterns and converts them to NSPredicate syntax.
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with predicate string selector, or null if not applicable
 */
export function convertXPathToPredicateString(xpath: string): XPathConversionResult | null {
    const elementType = extractElementTypeFromXPath(xpath)
    const conditions = extractXPathConditions(xpath)

    if (conditions.length === 0 && !elementType) {
        return null
    }

    const predicateParts: string[] = []

    if (elementType) {
        predicateParts.push(`type == '${elementType}'`)
    }

    const conditionStrings = groupOrConditions(conditions, 'single')
    predicateParts.push(...conditionStrings)

    if (predicateParts.length === 0) {
        return null
    }

    const predicateString = predicateParts.join(' AND ')
    return {
        selector: `-ios predicate string:${predicateString}`
    }
}

/**
 * Attempts to convert XPath to Accessibility ID selector.
 * Only works for simple cases with single @name or @label attribute.
 *
 * @param xpath - The XPath selector to convert
 * @returns The accessibility ID value, or null if not applicable
 */
export function convertXPathToAccessibilityId(xpath: string): string | null {
    const nameMatch = xpath.match(/@name\s*=\s*["']([^"']+)["']/)
    if (nameMatch) {
        return nameMatch[1]
    }

    const labelMatch = xpath.match(/@label\s*=\s*["']([^"']+)["']/)
    if (labelMatch) {
        return labelMatch[1]
    }

    return null
}
