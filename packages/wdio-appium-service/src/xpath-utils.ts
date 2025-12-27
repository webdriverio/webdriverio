/**
 * Utilities for converting XPath selectors to optimized iOS selector strategies.
 * Supports conversion to: Accessibility ID, iOS Predicate String, and iOS Class Chain.
 */

/**
 * Result of XPath conversion attempt
 */
export interface XPathConversionResult {
    selector: string | null
    warning?: string
}

/**
 * Condition extracted from XPath expression
 */
interface XPathCondition {
    attribute: string
    operator: string
    value: string
    logicalOp?: string
}

/**
 * Converts an XPath selector to an optimized alternative selector.
 * Priority: Accessibility ID > Predicate String > Class Chain
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with selector and optional warning, or null if conversion isn't possible
 */
export function convertXPathToOptimizedSelector(xpath: string): XPathConversionResult | null {
    if (!xpath || typeof xpath !== 'string') {
        return null
    }

    const unmappableFeatures = detectUnmappableXPathFeatures(xpath)
    if (unmappableFeatures.length > 0) {
        return {
            selector: null,
            warning: `XPath contains unmappable features: ${unmappableFeatures.join(', ')}. Cannot convert to optimized selector.`
        }
    }

    const isComplex = isComplexXPath(xpath)

    if (!isComplex) {
        const accessibilityId = convertXPathToAccessibilityId(xpath)
        if (accessibilityId) {
            return {
                selector: `~${accessibilityId}`
            }
        }
    }

    const predicateResult = convertXPathToPredicateString(xpath)
    if (predicateResult) {
        return predicateResult
    }

    const classChainResult = convertXPathToClassChain(xpath)
    if (classChainResult) {
        return classChainResult
    }

    return {
        selector: null,
        warning: 'XPath could not be converted to an optimized selector. Consider using accessibility identifiers or simpler XPath patterns.'
    }
}

/**
 * Detects XPath features that cannot be mapped to predicate strings or class chains.
 *
 * @param xpath - The XPath selector to analyze
 * @returns Array of unmappable feature names
 */
function detectUnmappableXPathFeatures(xpath: string): string[] {
    const unmappableFeatures: string[] = []

    /**
     * XPath axes that cannot be mapped to predicate strings or class chains:
     *
     * 1. ancestor:: - Traverses UP the tree to find all ancestors
     *    Example: //button[@name="Login"]/ancestor::XCUIElementTypeView
     *    Finds: All View elements that contain the Login button (parent, grandparent, etc.)
     *
     * 2. ancestor-or-self:: - Same as ancestor but includes the current element
     *    Example: //button[@name="Login"]/ancestor-or-self::XCUIElementTypeButton
     *    Finds: The button itself and all its ancestor buttons
     *
     * 3. following-sibling:: - Finds siblings that come AFTER the current element
     *    Example: //XCUIElementTypeCell[1]/following-sibling::XCUIElementTypeCell
     *    Finds: All cell elements that come after the first cell (same parent, later in order)
     *
     * 4. preceding-sibling:: - Finds siblings that come BEFORE the current element
     *    Example: //XCUIElementTypeCell[3]/preceding-sibling::XCUIElementTypeCell
     *    Finds: All cell elements that come before the third cell (same parent, earlier in order)
     *
     * 5. following:: - Finds ALL nodes that come AFTER in document order (anywhere in tree)
     *    Example: //XCUIElementTypeButton[@name="Login"]/following::XCUIElementTypeTextField
     *    Finds: All text fields that appear anywhere after the Login button in the document
     *
     * 6. preceding:: - Finds ALL nodes that come BEFORE in document order (anywhere in tree)
     *    Example: //XCUIElementTypeButton[@name="Submit"]/preceding::XCUIElementTypeTextField
     *    Finds: All text fields that appear anywhere before the Submit button in the document
     *
     * 7. parent:: - Finds the direct parent element
     *    Example: //XCUIElementTypeButton[@name="Login"]/parent::XCUIElementTypeView
     *    Finds: The direct parent View element containing the Login button
     *
     * Why unmappable: Predicate strings and class chains can only traverse DOWN (child/descendant),
     * not UP (parent/ancestor) or SIDEWAYS (siblings). They also can't navigate by document order.
     */
    const unmappableAxes = [
        { pattern: /ancestor::/i, name: 'ancestor axis' },
        { pattern: /ancestor-or-self::/i, name: 'ancestor-or-self axis' },
        { pattern: /following-sibling::/i, name: 'following-sibling axis' },
        { pattern: /preceding-sibling::/i, name: 'preceding-sibling axis' },
        { pattern: /following::/i, name: 'following axis' },
        { pattern: /preceding::/i, name: 'preceding axis' },
        { pattern: /parent::/i, name: 'parent axis' },
    ]

    for (const axis of unmappableAxes) {
        if (axis.pattern.test(xpath)) {
            unmappableFeatures.push(axis.name)
        }
    }

    /**
     * XPath functions that cannot be mapped to predicate strings or class chains:
     *
     * 1. normalize-space() - Removes leading/trailing whitespace and collapses multiple spaces
     *    Example: //button[normalize-space(text())="Login"]
     *    Finds: Button where text equals "Login" after normalizing whitespace
     *    Why unmappable: Predicate/class chain don't support text normalization operations
     *
     * 2. position() - Returns the position of the current node in its parent's children
     *    Example: //XCUIElementTypeCell[position()=2]
     *    Finds: The second cell element (by position in parent)
     *    Why unmappable: Position-based selection requires context that predicate/class chain don't provide
     *    Note: Simple [1] and [last()] are supported in class chain, but position() expressions are not
     *
     * 3. count() - Counts the number of nodes in a node-set
     *    Example: //XCUIElementTypeView[count(.//XCUIElementTypeButton)=3]
     *    Finds: Views that contain exactly 3 button elements
     *    Why unmappable: Counting operations require evaluating node-sets, which predicate/class chain don't support
     */
    const unmappableFunctions = [
        { pattern: /normalize-space\(/i, name: 'normalize-space() function' },
        { pattern: /position\(\)/i, name: 'position() function' },
        { pattern: /count\(/i, name: 'count() function' },
    ]

    for (const func of unmappableFunctions) {
        if (func.pattern.test(xpath)) {
            unmappableFeatures.push(func.name)
        }
    }

    /**
     * Checks for complex substring() patterns that cannot be mapped.
     *
     * substring() function extracts a portion of a string:
     * - substring(text(), 1, 5) - Gets first 5 characters (mappable to BEGINSWITH)
     * - substring(@name, 1, 3) - Gets first 3 characters of name attribute (mappable to BEGINSWITH)
     * - substring(text(), 5, 10) - Gets characters 5-10 (NOT mappable - doesn't start at position 1)
     *
     * Examples:
     * - Mappable: //button[substring(text(), 1, 5)="Login"] → label BEGINSWITH 'Login'
     * - Mappable: //button[substring(@name, 1, 3)="Log"] → name BEGINSWITH 'Log'
     * - Unmappable: //button[substring(text(), 5, 10)="in"] → Can't map middle/end substring
     *
     * Why some are unmappable: Only substring() starting at position 1 can be mapped to BEGINSWITH.
     * Substrings starting at other positions (e.g., position 5) cannot be expressed in predicate/class chain.
     */
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
 * An XPath is considered complex if it:
 * - Has multiple conditions (OR, AND, nested brackets)
 * - Uses functions that require predicate/class chain (contains, starts-with, ends-with, text(), substring())
 * - Has multiple attributes or complex attribute queries
 *
 * @param xpath - The XPath selector to check
 * @returns True if XPath contains complex patterns
 */
function isComplexXPath(xpath: string): boolean {
    const complexPatterns = [
        /\s+or\s+/i,
        /\s+and\s+/i,
        /contains\(/i,
        /starts-with\(/i,
        /ends-with\(/i,
        /text\(\)/i,
        /substring\(/i,
        /\[.*\[/,
        /@\w+\s*[!=<>]+\s*["'][^"']+["']\s+or\s+@\w+\s*[!=<>]+\s*["'][^"']+["']/i,
        /@\w+\s*[!=<>]+\s*["'][^"']+["']\s+and\s+@\w+\s*[!=<>]+\s*["'][^"']+["']/i,
    ]

    return complexPatterns.some(pattern => pattern.test(xpath))
}

/**
 * Attempts to convert XPath to Accessibility ID selector.
 * Only works for simple cases with single @name or @label attribute.
 *
 * @param xpath - The XPath selector to convert
 * @returns The accessibility ID value, or null if not applicable
 */
function convertXPathToAccessibilityId(xpath: string): string | null {
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

/**
 * Attempts to convert XPath to iOS Predicate String.
 * Handles common XPath patterns and converts them to NSPredicate syntax.
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with predicate string selector, or null if not applicable
 */
function convertXPathToPredicateString(xpath: string): XPathConversionResult | null {
    const elementTypeMatch = xpath.match(/\/\/XCUIElementType(\w+)/)
    const elementType = elementTypeMatch ? `XCUIElementType${elementTypeMatch[1]}` : null

    const conditions = extractXPathConditions(xpath)
    if (conditions.length === 0 && !elementType) {
        return null
    }

    const predicateParts: string[] = []

    if (elementType) {
        predicateParts.push(`type == '${elementType}'`)
    }

    const conditionStrings = groupOrConditionsForPredicateString(conditions)
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
 * Attempts to convert XPath to iOS Class Chain.
 * Handles hierarchy traversal and element filtering.
 *
 * @param xpath - The XPath selector to convert
 * @returns Conversion result with class chain selector, or null if not applicable
 */
function convertXPathToClassChain(xpath: string): XPathConversionResult | null {
    const elementTypeMatch = xpath.match(/\/\/XCUIElementType(\w+)/)
    const elementType = elementTypeMatch ? `XCUIElementType${elementTypeMatch[1]}` : null
    const isWildcard = xpath.startsWith('//*')

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
        const predicateParts = buildClassChainPredicates(conditions)
        if (predicateParts.length > 0) {
            chain += `[\`${predicateParts.join(' AND ')}\`]`
        }
    }

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

/**
 * Extracts all conditions from an XPath expression.
 * Handles OR conditions, contains, starts-with, ends-with, text(), and substring().
 *
 * @param xpath - The XPath selector to extract conditions from
 * @returns Array of extracted conditions
 */
function extractXPathConditions(xpath: string): XPathCondition[] {
    const conditions: XPathCondition[] = []
    const bracketContent = xpath.match(/\[(.+)\]$/)

    if (!bracketContent) {
        return conditions
    }

    const content = bracketContent[1]
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

    if (conditions.length === 0) {
        const simplePattern = /@(\w+)\s*=\s*["']([^"']+)["']/g
        let match: RegExpExecArray | null
        while ((match = simplePattern.exec(content)) !== null) {
            if (!orMatches.some(om => om.attr === match![1])) {
                conditions.push({
                    attribute: match[1],
                    operator: '=',
                    value: match[2]
                })
            }
        }
    }

    const containsPattern = /contains\(@(\w+),\s*["']([^"']+)["']\)/gi
    let containsMatch: RegExpExecArray | null
    while ((containsMatch = containsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: containsMatch[1],
            operator: 'contains',
            value: containsMatch[2]
        })
    }

    const startsWithPattern = /starts-with\(@(\w+),\s*["']([^"']+)["']\)/gi
    let startsWithMatch: RegExpExecArray | null
    while ((startsWithMatch = startsWithPattern.exec(content)) !== null) {
        conditions.push({
            attribute: startsWithMatch[1],
            operator: 'beginswith',
            value: startsWithMatch[2]
        })
    }

    const endsWithPattern = /ends-with\(@(\w+),\s*["']([^"']+)["']\)/gi
    let endsWithMatch: RegExpExecArray | null
    while ((endsWithMatch = endsWithPattern.exec(content)) !== null) {
        conditions.push({
            attribute: endsWithMatch[1],
            operator: 'endswith',
            value: endsWithMatch[2]
        })
    }

    const textEqualsPattern = /text\(\)\s*=\s*["']([^"']+)["']/gi
    let textEqualsMatch: RegExpExecArray | null
    while ((textEqualsMatch = textEqualsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: '=',
            value: textEqualsMatch[1]
        })
    }

    const textContainsPattern = /contains\(text\(\),\s*["']([^"']+)["']\)/gi
    let textContainsMatch: RegExpExecArray | null
    while ((textContainsMatch = textContainsPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: 'contains',
            value: textContainsMatch[1]
        })
    }

    const textSubstringPattern = /substring\(text\(\),\s*1\s*,\s*\d+\)\s*=\s*["']([^"']+)["']/gi
    let textSubstringMatch: RegExpExecArray | null
    while ((textSubstringMatch = textSubstringPattern.exec(content)) !== null) {
        conditions.push({
            attribute: 'label',
            operator: 'beginswith',
            value: textSubstringMatch[1]
        })
    }

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
 * The only difference between predicate strings and class chain predicates is the quote style:
 * - Predicate strings use single quotes: 'value'
 * - Class chain predicates use double quotes: "value"
 *
 * Supported operators:
 * - = (equality)
 * - != (inequality)
 * - contains (string contains)
 * - beginswith (string starts with)
 * - endswith (string ends with)
 * - >, <, >=, <= (comparison operators for numeric values)
 *
 * @param condition - The condition to convert
 * @param quoteStyle - Quote style to use: 'single' for predicate strings, 'double' for class chain
 * @returns Predicate string representation
 */
function convertXPathConditionToPredicate(condition: XPathCondition, quoteStyle: 'single' | 'double' = 'single'): string {
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
 * Converts multiple OR conditions on the same attribute to (value1 OR value2) format.
 * This function is shared between predicate strings and class chain predicates.
 *
 * @param conditions - Array of conditions to group
 * @param quoteStyle - Quote style to use: 'single' for predicate strings, 'double' for class chain
 * @returns Array of grouped condition strings
 */
function groupOrConditions(conditions: XPathCondition[], quoteStyle: 'single' | 'double' = 'single'): string[] {
    const result: string[] = []
    const orGroups: { [key: string]: string[] } = {}
    const regularConditions: string[] = []

    for (const condition of conditions) {
        const predicate = convertXPathConditionToPredicate(condition, quoteStyle)
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

/**
 * Groups OR conditions together for predicate string.
 * Converts multiple OR conditions on the same attribute to (value1 OR value2) format.
 *
 * @param conditions - Array of conditions to group
 * @returns Array of grouped condition strings
 */
function groupOrConditionsForPredicateString(conditions: XPathCondition[]): string[] {
    return groupOrConditions(conditions, 'single')
}

/**
 * Builds class chain predicates from conditions.
 * Groups OR conditions and formats them for class chain syntax.
 *
 * @param conditions - Array of conditions to convert
 * @returns Array of predicate strings for class chain
 */
function buildClassChainPredicates(conditions: XPathCondition[]): string[] {
    return groupOrConditions(conditions, 'double')
}

