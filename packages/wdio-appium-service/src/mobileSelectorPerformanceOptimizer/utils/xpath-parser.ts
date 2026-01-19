import type { XPathCondition } from './xpath-types.js'
import { UNMAPPABLE_XPATH_AXES, UNMAPPABLE_XPATH_FUNCTIONS } from './xpath-constants.js'

/**
 * Represents a single segment of a parsed XPath expression
 */
export interface XPathSegment {
    /** The axis used: '//' for descendant, '/' for child */
    axis: '//' | '/'
    /** The element type or '*' for wildcard */
    element: string
    /** Conditions/predicates for this segment */
    conditions: XPathCondition[]
    /** Positional index if specified (e.g., [1]) */
    index?: number
}

/**
 * Checks if the XPath contains unmappable features (axes or functions)
 * that cannot be converted to iOS class chain or predicate string.
 */
function containsUnmappableFeatures(xpath: string): boolean {
    // Check for parent traversal (..)
    if (/\/\.\.(?:\/|$|\[)/.test(xpath)) {
        return true
    }

    // Check for unmappable axes
    for (const axis of UNMAPPABLE_XPATH_AXES) {
        if (axis.pattern.test(xpath)) {
            return true
        }
    }

    // Check for unmappable functions
    for (const func of UNMAPPABLE_XPATH_FUNCTIONS) {
        if (func.pattern.test(xpath)) {
            return true
        }
    }

    return false
}

/**
 * Checks if the XPath contains a union operator (|)
 */
function containsUnionOperator(xpath: string): boolean {
    // Match | that's not inside brackets (predicates) or quotes
    // Simple check: look for | that's outside of [...] and quotes
    let depth = 0
    let inSingleQuote = false
    let inDoubleQuote = false

    for (let i = 0; i < xpath.length; i++) {
        const char = xpath[i]

        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote
        } else if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote
        } else if (!inSingleQuote && !inDoubleQuote) {
            if (char === '[') {
                depth++
            } else if (char === ']') {
                depth--
            } else if (char === '|' && depth === 0) {
                return true
            }
        }
    }

    return false
}

/**
 * Extracts conditions from a predicate string (content inside [...])
 */
function extractConditionsFromPredicate(predicateContent: string): XPathCondition[] {
    const conditions: XPathCondition[] = []

    // Handle OR conditions: @attr="val1" or @attr="val2"
    const orPattern = /@(\w+)\s*=\s*["']([^"']+)["']\s+or\s+@(\w+)\s*=\s*["']([^"']+)["']/gi
    let orMatch: RegExpExecArray | null
    const processedOrParts = new Set<string>()

    while ((orMatch = orPattern.exec(predicateContent)) !== null) {
        // Both attributes in OR must be the same for grouping
        if (orMatch[1] === orMatch[3]) {
            conditions.push({
                attribute: orMatch[1],
                operator: '=',
                value: orMatch[2],
                logicalOp: 'OR'
            })
            conditions.push({
                attribute: orMatch[3],
                operator: '=',
                value: orMatch[4],
                logicalOp: 'OR'
            })
            processedOrParts.add(orMatch[0])
        }
    }

    // Handle contains(@attr, 'value')
    const containsPattern = /contains\s*\(\s*@(\w+)\s*,\s*["']([^"']+)["']\s*\)/gi
    let containsMatch: RegExpExecArray | null

    while ((containsMatch = containsPattern.exec(predicateContent)) !== null) {
        conditions.push({
            attribute: containsMatch[1],
            operator: 'contains',
            value: containsMatch[2]
        })
    }

    // Handle starts-with(@attr, 'value')
    const startsWithPattern = /starts-with\s*\(\s*@(\w+)\s*,\s*["']([^"']+)["']\s*\)/gi
    let startsWithMatch: RegExpExecArray | null

    while ((startsWithMatch = startsWithPattern.exec(predicateContent)) !== null) {
        conditions.push({
            attribute: startsWithMatch[1],
            operator: 'beginswith',
            value: startsWithMatch[2]
        })
    }

    // Handle ends-with(@attr, 'value')
    const endsWithPattern = /ends-with\s*\(\s*@(\w+)\s*,\s*["']([^"']+)["']\s*\)/gi
    let endsWithMatch: RegExpExecArray | null

    while ((endsWithMatch = endsWithPattern.exec(predicateContent)) !== null) {
        conditions.push({
            attribute: endsWithMatch[1],
            operator: 'endswith',
            value: endsWithMatch[2]
        })
    }

    // Handle simple @attr="value" (that weren't part of OR)
    // Need to avoid matching parts that were already processed as OR conditions
    const simpleAttrPattern = /@(\w+)\s*=\s*["']([^"']+)["']/g
    let simpleMatch: RegExpExecArray | null

    while ((simpleMatch = simpleAttrPattern.exec(predicateContent)) !== null) {
        // Check if this was part of an OR condition
        let isPartOfOr = false
        for (const orPart of processedOrParts) {
            if (orPart.includes(simpleMatch[0])) {
                isPartOfOr = true
                break
            }
        }

        if (!isPartOfOr) {
            // Only add if not already added via OR
            const alreadyAdded = conditions.some(
                c => c.attribute === simpleMatch![1] && c.value === simpleMatch![2] && c.operator === '='
            )

            if (!alreadyAdded) {
                conditions.push({
                    attribute: simpleMatch[1],
                    operator: '=',
                    value: simpleMatch[2]
                })
            }
        }
    }

    return conditions
}

/**
 * Checks if an element is valid for iOS class chain (XCUIElementType* or wildcard *)
 */
function isValidIOSElement(element: string): boolean {
    return element === '*' || element.startsWith('XCUIElementType')
}

/**
 * Parses a single XPath segment (element with optional predicates)
 */
function parseSegment(segmentStr: string, axis: '//' | '/'): XPathSegment | null {
    // Handle grouped expression with index: (//Element[@attr="val"])[1]
    // This is handled at the top level, not here

    // Extract element type and predicates
    // Format: ElementType[predicate1][predicate2]... or *[predicate]
    const elementMatch = segmentStr.match(/^([A-Za-z*][\w]*)(.*)$/)
    if (!elementMatch) {
        return null
    }

    const element = elementMatch[1]

    // Validate that the element is valid for iOS (XCUIElementType* or *)
    if (!isValidIOSElement(element)) {
        return null
    }

    const predicatePart = elementMatch[2]

    const conditions: XPathCondition[] = []
    let index: number | undefined

    if (predicatePart) {
        // Extract all predicates [...][...]
        const predicatePattern = /\[([^\]]+)\]/g
        let predicateMatch: RegExpExecArray | null

        while ((predicateMatch = predicatePattern.exec(predicatePart)) !== null) {
            const content = predicateMatch[1].trim()

            // Check if it's a numeric index
            if (/^\d+$/.test(content)) {
                index = parseInt(content, 10)
            } else if (content === 'last()') {
                // Handle last() - we'll need special handling
                // For now, skip it as index
            } else {
                // It's a condition predicate
                const extractedConditions = extractConditionsFromPredicate(content)
                conditions.push(...extractedConditions)
            }
        }
    }

    return {
        axis,
        element,
        conditions,
        index
    }
}

/**
 * Splits an XPath expression into individual path segments.
 * Handles both // (descendant) and / (child) axes.
 */
function splitXPathIntoRawSegments(xpath: string): Array<{ axis: '//' | '/', content: string }> | null {
    const segments: Array<{ axis: '//' | '/', content: string }> = []

    // Remove leading/trailing whitespace
    let remaining = xpath.trim()

    // Handle grouped expression: (//...)[index]
    // Transform (//Element[@attr="val"])[1]/NextElement
    // into //Element[@attr="val"][1]/NextElement
    const groupedMatch = remaining.match(/^\(([^)]+)\)\[(\d+)\](.*)$/)
    if (groupedMatch) {
        const innerXPath = groupedMatch[1]
        const groupIndex = groupedMatch[2]
        const afterGroup = groupedMatch[3]

        // Parse the inner XPath and append the index to the last segment
        const innerSegments = splitXPathIntoRawSegments(innerXPath)
        if (!innerSegments || innerSegments.length === 0) {
            return null
        }

        // Add the index to the last segment's content
        const lastSegment = innerSegments[innerSegments.length - 1]
        lastSegment.content += `[${groupIndex}]`

        segments.push(...innerSegments)

        // If there's more after the group, continue parsing
        if (afterGroup && afterGroup.length > 0) {
            remaining = afterGroup
        } else {
            return segments
        }
    }

    // Must start with // or /
    if (remaining.startsWith('//')) {
        remaining = remaining.slice(2)
    } else if (remaining.startsWith('/')) {
        remaining = remaining.slice(1)
    } else if (segments.length === 0) {
        // If we haven't already processed a grouped expression, this is invalid
        return null
    }

    // Now parse segments separated by // or /
    // We need to be careful about brackets when splitting

    let currentSegment = ''
    let bracketDepth = 0
    let inSingleQuote = false
    let inDoubleQuote = false
    let i = 0

    // Determine the axis for the first segment
    // If we already have segments from grouped expression, the remaining starts with /
    let currentAxis: '//' | '/' = segments.length > 0 ? '/' : '//'

    while (i < remaining.length) {
        const char = remaining[i]
        const nextChar = remaining[i + 1]

        // Track quote state
        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote
        } else if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote
        }

        // Track bracket depth (only when not in quotes)
        if (!inSingleQuote && !inDoubleQuote) {
            if (char === '[') {
                bracketDepth++
            } else if (char === ']') {
                bracketDepth--
            }
        }

        // Check for path separator (only when not in brackets or quotes)
        if (bracketDepth === 0 && !inSingleQuote && !inDoubleQuote) {
            if (char === '/' && nextChar === '/') {
                // End current segment, start new one with // axis
                if (currentSegment.length > 0) {
                    segments.push({ axis: currentAxis, content: currentSegment })
                }
                currentSegment = ''
                currentAxis = '//'
                i += 2
                continue
            } else if (char === '/') {
                // End current segment, start new one with / axis
                if (currentSegment.length > 0) {
                    segments.push({ axis: currentAxis, content: currentSegment })
                }
                currentSegment = ''
                currentAxis = '/'
                i += 1
                continue
            }
        }

        currentSegment += char
        i++
    }

    // Don't forget the last segment
    if (currentSegment.length > 0) {
        segments.push({ axis: currentAxis, content: currentSegment })
    }

    return segments.length > 0 ? segments : null
}

/**
 * Parses an XPath expression into structured segments.
 *
 * @param xpath - The XPath expression to parse
 * @returns Array of XPathSegment objects, or null if the XPath cannot be parsed
 */
export function parseXPathToSegments(xpath: string): XPathSegment[] | null {
    if (!xpath || typeof xpath !== 'string') {
        return null
    }

    // Check for unmappable features first
    if (containsUnmappableFeatures(xpath)) {
        return null
    }

    // Check for union operator
    if (containsUnionOperator(xpath)) {
        return null
    }

    // Split into raw segments
    const rawSegments = splitXPathIntoRawSegments(xpath)
    if (!rawSegments) {
        return null
    }

    // Parse each segment
    const segments: XPathSegment[] = []

    for (const raw of rawSegments) {
        const segment = parseSegment(raw.content, raw.axis)
        if (!segment) {
            return null
        }
        segments.push(segment)
    }

    return segments.length > 0 ? segments : null
}
