import type { XPathConversionResult } from './xpath-types.js'
import { extractXPathConditions, groupOrConditions } from './xpath-conditions.js'
import { extractElementTypeFromXPath, isWildcardXPath } from './xpath-detection.js'

/**
 * Attempts to convert XPath to iOS Class Chain.
 * Handles hierarchy traversal and element filtering.
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with class chain selector, or null if not applicable
 */
export function convertXPathToClassChain(xpath: string): XPathConversionResult | null {
    const elementType = extractElementTypeFromXPath(xpath)
    const isWildcard = isWildcardXPath(xpath)
    const conditions = extractXPathConditions(xpath)

    let chain = '**/'

    if (elementType) {
        chain += elementType
    } else if (isWildcard) {
        chain += '*'
    } else {
        return null
    }

    if (conditions.length > 0) {
        const predicateParts = groupOrConditions(conditions, 'double')
        if (predicateParts.length > 0) {
            chain += `[\`${predicateParts.join(' AND ')}\`]`
        }
    }

    // Handle position index (e.g., [1], [2])
    const positionMatch = xpath.match(/\[(\d+)\]$/)
    if (positionMatch) {
        const index = parseInt(positionMatch[1], 10)
        if (index > 0) {
            chain += `[${index}]`
        }
    } else if (/\[last\(\)\]/i.test(xpath)) {
        chain += '[last()]'
    }

    return {
        selector: `-ios class chain:${chain}`
    }
}
