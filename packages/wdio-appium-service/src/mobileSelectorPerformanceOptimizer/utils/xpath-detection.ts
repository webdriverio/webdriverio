import {
    UNMAPPABLE_XPATH_AXES,
    UNMAPPABLE_XPATH_FUNCTIONS,
    COMPLEX_XPATH_PATTERNS
} from './xpath-constants.js'

/**
 * Detects XPath features that cannot be mapped to predicate strings or class chains.
 *
 * @param xpath - The XPath selector to analyze
 * @returns Array of unmappable feature names
 */
export function detectUnmappableXPathFeatures(xpath: string): string[] {
    const unmappableFeatures: string[] = []

    for (const axis of UNMAPPABLE_XPATH_AXES) {
        if (axis.pattern.test(xpath)) {
            unmappableFeatures.push(axis.name)
        }
    }

    for (const func of UNMAPPABLE_XPATH_FUNCTIONS) {
        if (func.pattern.test(xpath)) {
            unmappableFeatures.push(func.name)
        }
    }

    // Check for complex substring() patterns that cannot be mapped
    if (/substring\([^)]+\)/.test(xpath)) {
        const textSubstringMatch = xpath.match(/substring\(text\(\),\s*1\s*,\s*\d+\)/i)
        const attrSubstringMatch = xpath.match(/substring\(@\w+,\s*1\s*,\s*\d+\)/i)

        if (!textSubstringMatch && !attrSubstringMatch) {
            const substringMatch = xpath.match(/substring\([^,]+,\s*(\d+)/i)
            if (substringMatch && substringMatch[1] !== '1') {
                unmappableFeatures.push('complex substring() function (not starting at position 1)')
            }
        }
    }

    return unmappableFeatures
}

/**
 * Checks if an XPath is complex (contains OR, AND, contains, etc.).
 * Used to determine if we should skip accessibility ID conversion.
 *
 * @param xpath - The XPath selector to check
 * @returns True if XPath contains complex patterns
 */
export function isComplexXPath(xpath: string): boolean {
    return COMPLEX_XPATH_PATTERNS.some(pattern => pattern.test(xpath))
}

/**
 * Extracts the element type from an XPath selector.
 *
 * @param xpath - The XPath selector
 * @returns The element type (e.g., 'XCUIElementTypeButton') or null
 */
export function extractElementTypeFromXPath(xpath: string): string | null {
    const elementTypeMatch = xpath.match(/\/\/XCUIElementType(\w+)/)
    return elementTypeMatch ? `XCUIElementType${elementTypeMatch[1]}` : null
}

/**
 * Checks if an XPath uses a wildcard selector.
 *
 * @param xpath - The XPath selector
 * @returns True if the XPath starts with //*
 */
export function isWildcardXPath(xpath: string): boolean {
    return xpath.startsWith('//*')
}
