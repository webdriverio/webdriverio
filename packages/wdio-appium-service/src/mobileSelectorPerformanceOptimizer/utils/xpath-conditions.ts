import type { XPathCondition } from './xpath-types.js'

/**
 * Extracts all conditions from an XPath expression.
 * Handles OR conditions, contains, starts-with, ends-with, text(), and substring().
 *
 * @param xpath - The XPath selector to extract conditions from
 * @returns Array of extracted conditions
 */
export function extractXPathConditions(xpath: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const bracketContent = xpath.match(/\[(.+)\]$/)

    if (!bracketContent) {
        return conditions
    }

    const content = bracketContent[1]

    // Extract OR conditions first
    const orConditions = extractOrConditions(content)
    conditions.push(...orConditions)

    // If no OR conditions found, extract simple conditions
    if (conditions.length === 0) {
        const simpleConditions = extractSimpleConditions(content, [])
        conditions.push(...simpleConditions)
    }

    // Extract function-based conditions
    conditions.push(...extractContainsConditions(content))
    conditions.push(...extractStartsWithConditions(content))
    conditions.push(...extractEndsWithConditions(content))
    conditions.push(...extractTextConditions(content))
    conditions.push(...extractSubstringConditions(content))

    return conditions
}

/**
 * Extracts OR conditions from XPath content.
 */
function extractOrConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const orMatches: Array<{ attr: string, values: string[] }> = []

    const orPattern = /@(\w+)\s*=\s*["']([^"']+)["']\s+or\s+@(\w+)\s*=\s*["']([^"']+)["']/gi
    let orMatch: RegExpExecArray | null

    while ((orMatch = orPattern.exec(content)) !== null) {
        if (orMatch[1] === orMatch[3]) {
            const existing = orMatches.find(m => m.attr === orMatch![1])
            if (existing) {
                if (!existing.values.includes(orMatch[2])) {
                    existing.values.push(orMatch[2])
                }
                if (!existing.values.includes(orMatch[4])) {
                    existing.values.push(orMatch[4])
                }
            } else {
                orMatches.push({
                    attr: orMatch[1],
                    values: [orMatch[2], orMatch[4]]
                })
            }
        }
    }

    for (const orMatch of orMatches) {
        for (const value of orMatch.values) {
            conditions.push({
                attribute: orMatch.attr,
                operator: '=',
                value: value,
                logicalOp: 'OR'
            })
        }
    }

    return conditions
}

/**
 * Extracts simple attribute conditions from XPath content.
 */
function extractSimpleConditions(content: string, orAttributes: string[]): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const simplePattern = /@(\w+)\s*=\s*["']([^"']+)["']/g
    let match: RegExpExecArray | null

    while ((match = simplePattern.exec(content)) !== null) {
        if (!orAttributes.includes(match[1])) {
            conditions.push({
                attribute: match[1],
                operator: '=',
                value: match[2]
            })
        }
    }

    return conditions
}

/**
 * Extracts contains() function conditions.
 */
function extractContainsConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const containsPattern = /contains\(@(\w+),\s*["']([^"']+)["']\)/gi
    let match: RegExpExecArray | null

    while ((match = containsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: match[1],
            operator: 'contains',
            value: match[2]
        })
    }

    return conditions
}

/**
 * Extracts starts-with() function conditions.
 */
function extractStartsWithConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const startsWithPattern = /starts-with\(@(\w+),\s*["']([^"']+)["']\)/gi
    let match: RegExpExecArray | null

    while ((match = startsWithPattern.exec(content)) !== null) {
        conditions.push({
            attribute: match[1],
            operator: 'beginswith',
            value: match[2]
        })
    }

    return conditions
}

/**
 * Extracts ends-with() function conditions.
 */
function extractEndsWithConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const endsWithPattern = /ends-with\(@(\w+),\s*["']([^"']+)["']\)/gi
    let match: RegExpExecArray | null

    while ((match = endsWithPattern.exec(content)) !== null) {
        conditions.push({
            attribute: match[1],
            operator: 'endswith',
            value: match[2]
        })
    }

    return conditions
}

/**
 * Extracts text() related conditions.
 */
function extractTextConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []

    // text() = 'value'
    const textEqualsPattern = /text\(\)\s*=\s*["']([^"']+)["']/gi
    let textEqualsMatch: RegExpExecArray | null
    while ((textEqualsMatch = textEqualsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: '=',
            value: textEqualsMatch[1]
        })
    }

    // contains(text(), 'value')
    const textContainsPattern = /contains\(text\(\),\s*["']([^"']+)["']\)/gi
    let textContainsMatch: RegExpExecArray | null
    while ((textContainsMatch = textContainsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: 'contains',
            value: textContainsMatch[1]
        })
    }

    return conditions
}

/**
 * Extracts substring() related conditions.
 */
function extractSubstringConditions(content: string): XPathCondition[] {
    const conditions: XPathCondition[] = []

    // substring(text(), 1, n) = 'value' -> BEGINSWITH
    const textSubstringPattern = /substring\(text\(\),\s*1\s*,\s*\d+\)\s*=\s*["']([^"']+)["']/gi
    let textSubstringMatch: RegExpExecArray | null
    while ((textSubstringMatch = textSubstringPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: 'beginswith',
            value: textSubstringMatch[1]
        })
    }

    // substring(@attr, 1, n) = 'value' -> BEGINSWITH
    const attrSubstringPattern = /substring\(@(\w+),\s*1\s*,\s*\d+\)\s*=\s*["']([^"']+)["']/gi
    let attrSubstringMatch: RegExpExecArray | null
    while ((attrSubstringMatch = attrSubstringPattern.exec(content)) !== null) {
        conditions.push({
            attribute: attrSubstringMatch[1],
            operator: 'beginswith',
            value: attrSubstringMatch[2]
        })
    }

    return conditions
}

/**
 * Converts a single XPath condition to predicate syntax (NSPredicate or Class Chain).
 *
 * @param condition - The condition to convert
 * @param quoteStyle - Quote style to use: 'single' for predicate strings, 'double' for class chain
 * @returns Predicate string representation
 */
export function convertConditionToPredicate(
    condition: XPathCondition,
    quoteStyle: 'single' | 'double' = 'single'
): string {
    const attr = condition.attribute
    const val = condition.value
    const quote = quoteStyle === 'single' ? "'" : '"'

    switch (condition.operator.toLowerCase()) {
    case '=':
        return `${attr} == ${quote}${val}${quote}`
    case '!=':
    case '<>':
        return `${attr} != ${quote}${val}${quote}`
    case 'contains':
        return `${attr} CONTAINS ${quote}${val}${quote}`
    case 'beginswith':
        return `${attr} BEGINSWITH ${quote}${val}${quote}`
    case 'endswith':
        return `${attr} ENDSWITH ${quote}${val}${quote}`
    case '>':
        return `${attr} > ${quote}${val}${quote}`
    case '<':
        return `${attr} < ${quote}${val}${quote}`
    case '>=':
        return `${attr} >= ${quote}${val}${quote}`
    case '<=':
        return `${attr} <= ${quote}${val}${quote}`
    default:
        return `${attr} == ${quote}${val}${quote}`
    }
}

/**
 * Groups OR conditions together and converts them to predicate syntax.
 *
 * @param conditions - Array of conditions to group
 * @param quoteStyle - Quote style to use: 'single' for predicate strings, 'double' for class chain
 * @returns Array of grouped condition strings
 */
export function groupOrConditions(
    conditions: XPathCondition[],
    quoteStyle: 'single' | 'double' = 'single'
): string[] {
    const result: string[] = []
    const orGroups: { [key: string]: string[] } = {}
    const regularConditions: string[] = []

    for (const condition of conditions) {
        const predicate = convertConditionToPredicate(condition, quoteStyle)
        if (condition.logicalOp === 'OR') {
            if (!orGroups[condition.attribute]) {
                orGroups[condition.attribute] = []
            }
            orGroups[condition.attribute].push(predicate)
        } else {
            regularConditions.push(predicate)
        }
    }

    for (const [, values] of Object.entries(orGroups)) {
        if (values.length > 1) {
            result.push(`(${values.join(' OR ')})`)
        } else {
            result.push(values[0])
        }
    }

    result.push(...regularConditions)
    return result
}
