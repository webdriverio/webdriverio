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
 * Options for XPath conversion
 */
export interface XPathConversionOptions {
    /**
     * Browser instance for dynamic page source analysis
     */
    browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    /**
     * Whether to use page source analysis for more accurate suggestions
     */
    usePageSource?: boolean
}

/**
 * Converts an XPath selector to an optimized alternative selector.
 * Priority: Accessibility ID > Predicate String > Class Chain
 *
 * @param xpath - The XPath selector to convert
 * @param options - Conversion options including browser instance and element ID for dynamic analysis
 * @returns Conversion result with selector and optional warning, or null if conversion isn't possible.
 *          Returns a Promise when usePageSource is enabled, otherwise returns synchronously.
 */
export function convertXPathToOptimizedSelector(
    xpath: string,
    options?: XPathConversionOptions
): XPathConversionResult | null | Promise<XPathConversionResult | null> {
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

    // Try static conversion first (fast path)
    const staticResult = convertXPathToOptimizedSelectorStatic(xpath)

    // If usePageSource is enabled and we have browser, try dynamic analysis
    if (options?.usePageSource && options?.browser) {
        return convertXPathToOptimizedSelectorDynamic(xpath, options.browser, staticResult)
    }

    return staticResult
}

/**
 * Static XPath conversion (pattern-based, no page source analysis)
 */
function convertXPathToOptimizedSelectorStatic(xpath: string): XPathConversionResult | null {
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
 * Dynamic XPath conversion using page source analysis.
 * Analyzes the actual element from page source to find optimal selectors.
 *
 * @param xpath - The original XPath selector
 * @param browser - Browser instance to get page source
 * @param staticResult - Result from static conversion (used as fallback)
 * @returns Conversion result with selector and optional warning
 */
async function convertXPathToOptimizedSelectorDynamic(
    xpath: string,
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    staticResult: XPathConversionResult | null
): Promise<XPathConversionResult | null> {
    try {
        // Page source collection logging is handled by the caller
        const browserWithPageSource = browser as WebdriverIO.Browser & {
            getPageSource: () => Promise<string>
        }
        const pageSource = await browserWithPageSource.getPageSource()

        if (!pageSource || typeof pageSource !== 'string') {
            return staticResult
        }

        // Parse XML to extract element data based on the original XPath
        const elementData = parseElementFromPageSource(pageSource, xpath)

        if (!elementData) {
            return staticResult
        }

        // Build optimal selector based on actual element attributes
        // Priority: Accessibility ID > Predicate String > Class Chain
        // Ensure selector is unique by testing against page source XML (no extra protocol calls)
        const dynamicResult = buildSelectorFromElementData(elementData, pageSource)

        // Return dynamic result if it's better than static, otherwise return static
        if (dynamicResult && dynamicResult.selector) {
            return dynamicResult
        }

        return staticResult
    } catch {
        // If dynamic analysis fails, fall back to static result
        return staticResult
    }
}

/**
 * Parses page source XML to extract element data based on the original XPath.
 * Finds the specific element that matches the XPath criteria.
 *
 * @param pageSource - The page source XML
 * @param xpath - The original XPath selector used to find the element
 * @returns Element data if found, null otherwise
 */
function parseElementFromPageSource(pageSource: string, xpath: string): ElementData | null {
    // Extract criteria from XPath to find the matching element in page source
    // Example: //*[@name="Home"] -> find element with name="Home"
    // Example: //XCUIElementTypeButton[@name="Login"] -> find XCUIElementTypeButton with name="Login"

    // Extract element type from XPath (e.g., XCUIElementTypeButton)
    const elementTypeMatch = xpath.match(/\/\/XCUIElementType(\w+)/)
    const expectedElementType = elementTypeMatch ? `XCUIElementType${elementTypeMatch[1]}` : null

    // Extract attribute conditions from XPath (e.g., @name="Home", @label="Login")
    // Group OR conditions by attribute (e.g., @name="Allow" or @name="OK" -> { name: ["Allow", "OK"] })
    const attributeConditions: Record<string, string[]> = {}
    const orConditions: Record<string, string[]> = {}

    // First, extract OR conditions (e.g., @name="Allow" or @name="OK")
    const orPattern = /@(\w+)\s*=\s*["']([^"']+)["']\s+or\s+@(\w+)\s*=\s*["']([^"']+)["']/gi
    let orMatch: RegExpExecArray | null
    while ((orMatch = orPattern.exec(xpath)) !== null) {
        if (orMatch[1] === orMatch[3]) {
            // Same attribute with OR values
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

    // Then, extract regular conditions (excluding those already in OR conditions)
    const attrPattern = /@(\w+)\s*=\s*["']([^"']+)["']/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrPattern.exec(xpath)) !== null) {
        // Skip if this attribute is part of an OR condition
        if (!orConditions[attrMatch[1]]) {
            if (!attributeConditions[attrMatch[1]]) {
                attributeConditions[attrMatch[1]] = []
            }
            if (!attributeConditions[attrMatch[1]].includes(attrMatch[2])) {
                attributeConditions[attrMatch[1]].push(attrMatch[2])
            }
        }
    }

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
        const attrMatches = attrs.matchAll(/(\w+)="([^"]*)"/g)
        const elementAttrs: Record<string, string> = {}
        for (const attrMatch of attrMatches) {
            elementAttrs[attrMatch[1]] = attrMatch[2]
        }

        // Check if element matches all attribute conditions from XPath
        let matchesAllConditions = true

        // Check regular conditions (AND logic - all must match)
        for (const [attr, values] of Object.entries(attributeConditions)) {
            const elementValue = elementAttrs[attr]
            if (!elementValue || !values.includes(elementValue)) {
                matchesAllConditions = false
                break
            }
        }

        // Check OR conditions (OR logic - at least one must match)
        if (matchesAllConditions) {
            for (const [attr, values] of Object.entries(orConditions)) {
                const elementValue = elementAttrs[attr]
                if (!elementValue || !values.includes(elementValue)) {
                    matchesAllConditions = false
                    break
                }
            }
        }

        // If no specific conditions, but XPath has wildcard, accept any element with name/label
        // This handles cases like //*[@name="Home"] where we want any element with name="Home"
        if (Object.keys(attributeConditions).length === 0 && Object.keys(orConditions).length === 0) {
            if (!elementAttrs.name && !elementAttrs.label) {
                matchesAllConditions = false
            }
        }

        if (matchesAllConditions) {
            return {
                type: tagName,
                attributes: elementAttrs
            }
        }
    }

    // If no exact match found, try to find element by the first attribute condition
    // This handles cases where the XPath might be more complex but we can still find a match
    const allConditions = { ...attributeConditions, ...orConditions }
    if (Object.keys(allConditions).length > 0) {
        const firstAttr = Object.keys(allConditions)[0]
        const firstValues = allConditions[firstAttr]
        const elementPattern2 = /<(\w+)([^>]*)>/g
        let match2: RegExpExecArray | null

        while ((match2 = elementPattern2.exec(pageSource)) !== null) {
            const tagName = match2[1]
            const attrs = match2[2]

            // Check element type if specified
            if (expectedElementType && tagName !== expectedElementType) {
                continue
            }

            // Extract attributes
            const attrMatches = attrs.matchAll(/(\w+)="([^"]*)"/g)
            const elementAttrs: Record<string, string> = {}
            for (const attrMatch of attrMatches) {
                elementAttrs[attrMatch[1]] = attrMatch[2]
            }

            // Check if this element matches the first condition
            const elementValue = elementAttrs[firstAttr]
            if (elementValue && firstValues.includes(elementValue)) {
                return {
                    type: tagName,
                    attributes: elementAttrs
                }
            }
        }
    }

    return null
}

/**
 * Element data extracted from page source
 */
interface ElementData {
    type: string
    attributes: Record<string, string>
}

/**
 * Tests if a selector matches exactly one element by parsing the page source XML.
 * This avoids making additional protocol calls and is much faster.
 *
 * @param selector - The selector to test (accessibility ID, predicate string, or class chain)
 * @param pageSource - The page source XML to search in
 * @returns True if exactly one element matches the selector
 */
function isSelectorUniqueInPageSource(selector: string, pageSource: string): boolean {
    try {
        if (selector.startsWith('~')) {
            // Accessibility ID: count elements with matching name or label
            const value = selector.substring(1)
            const namePattern = new RegExp(`<\\w+[^>]*\\s+name="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'gi')
            const labelPattern = new RegExp(`<\\w+[^>]*\\s+label="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'gi')
            const nameMatches = pageSource.match(namePattern) || []
            const labelMatches = pageSource.match(labelPattern) || []
            // Combine and deduplicate (an element might have both name and label)
            const allMatches = new Set([...nameMatches, ...labelMatches])
            return allMatches.size === 1
        } else if (selector.startsWith('-ios predicate string:')) {
            // Predicate string: parse conditions and count matching elements
            const predicateString = selector.substring('-ios predicate string:'.length)
            return countMatchingElementsByPredicate(predicateString, pageSource) === 1
        } else if (selector.startsWith('-ios class chain:')) {
            // Class chain: parse chain and count matching elements
            const chainString = selector.substring('-ios class chain:'.length)
            return countMatchingElementsByClassChain(chainString, pageSource) === 1
        }
        return false
    } catch {
        // If parsing fails, consider it not unique
        return false
    }
}

/**
 * Counts elements matching a predicate string by parsing page source XML
 */
function countMatchingElementsByPredicate(predicateString: string, pageSource: string): number {
    // Parse predicate conditions (e.g., "type == 'XCUIElementTypeButton' AND name == 'Login'")
    const conditions: Array<{ attr: string, op: string, value: string }> = []

    // Extract type condition
    const typeMatch = predicateString.match(/type\s*==\s*'([^']+)'/)
    const elementType = typeMatch ? typeMatch[1] : null

    // Extract attribute conditions
    const attrPattern = /(\w+)\s*==\s*'([^']+)'/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrPattern.exec(predicateString)) !== null) {
        if (attrMatch[1] !== 'type') {
            conditions.push({ attr: attrMatch[1], op: '==', value: attrMatch[2] })
        }
    }

    // Find all elements matching the type
    const elementPattern = elementType
        ? new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')
        : /<(\w+)([^>]*)>/gi

    let match: RegExpExecArray | null
    let count = 0

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const attrs = match[1] || match[2] || ''

        // Check if element matches all conditions
        let matches = true

        // Check type (if specified)
        if (elementType && !match[0].includes(`<${elementType}`)) {
            matches = false
        }

        // Check attribute conditions
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

/**
 * Counts elements matching a class chain by parsing page source XML
 */
function countMatchingElementsByClassChain(chainString: string, pageSource: string): number {
    // Parse class chain (e.g., "**/XCUIElementTypeButton[`name == "Login"`]")
    const typeMatch = chainString.match(/^\*\*\/(\w+)/)
    const elementType = typeMatch ? typeMatch[1] : null

    if (!elementType) {
        return 0
    }

    // Extract predicate conditions from backticks
    const predicateMatch = chainString.match(/\[`([^`]+)`\]/)
    const conditions: Array<{ attr: string, op: string, value: string }> = []

    if (predicateMatch) {
        const predicateContent = predicateMatch[1]
        const attrPattern = /(\w+)\s*==\s*"([^"]+)"/g
        let attrMatch: RegExpExecArray | null
        while ((attrMatch = attrPattern.exec(predicateContent)) !== null) {
            conditions.push({ attr: attrMatch[1], op: '==', value: attrMatch[2] })
        }
    }

    // Find all elements matching the type
    const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')

    let match: RegExpExecArray | null
    let count = 0

    while ((match = elementPattern.exec(pageSource)) !== null) {
        const attrs = match[1] || ''

        // Check if element matches all conditions
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

/**
 * Builds optimal selector from element data, ensuring uniqueness.
 * Priority: Accessibility ID > Predicate String > Class Chain
 * Progressively adds attributes until selector is unique.
 *
 * @param elementData - Element data extracted from page source
 * @param pageSource - The page source XML to test selector uniqueness against
 * @returns Conversion result with unique selector, or warning if not unique
 */
function buildSelectorFromElementData(
    elementData: ElementData,
    pageSource: string
): XPathConversionResult | null {
    const { type, attributes } = elementData

    // Priority order of attributes to use for making selectors unique
    const attributePriority = ['name', 'label', 'value', 'enabled', 'visible', 'accessible', 'hittable']

    // 1. Try Accessibility ID (highest priority)
    const name = attributes.name || attributes.label
    if (name) {
        const accessibilitySelector = `~${name}`
        const isUnique = isSelectorUniqueInPageSource(accessibilitySelector, pageSource)
        if (isUnique) {
            return {
                selector: accessibilitySelector
            }
        }
        // If not unique, continue to predicate string with more attributes
    }

    // 2. Try Predicate String - build progressively more specific selectors
    if (type) {
        const predicateResult = buildUniquePredicateString(type, attributes, attributePriority, pageSource)
        if (predicateResult) {
            return predicateResult
        }
    }

    // 3. Try Class Chain - build progressively more specific selectors
    if (type) {
        const classChainResult = buildUniqueClassChain(type, attributes, attributePriority, pageSource)
        if (classChainResult) {
            return classChainResult
        }
    }

    // If we couldn't make any selector unique, return warning
    return {
        selector: null,
        warning: 'Could not generate a unique selector from element data. Multiple elements may match the suggested selector.'
    }
}

/**
 * Builds a unique predicate string by progressively adding attributes
 */
function buildUniquePredicateString(
    type: string,
    attributes: Record<string, string>,
    attributePriority: string[],
    pageSource: string
): XPathConversionResult | null {
    const predicateParts: string[] = [`type == '${type}'`]

    // Try adding attributes one by one until we get a unique selector
    for (const attr of attributePriority) {
        if (attributes[attr] !== undefined) {
            const value = attributes[attr]
            if (typeof value === 'string' && value.length > 0) {
                predicateParts.push(`${attr} == '${value}'`)
                const selector = `-ios predicate string:${predicateParts.join(' AND ')}`
                const isUnique = isSelectorUniqueInPageSource(selector, pageSource)
                if (isUnique) {
                    return {
                        selector
                    }
                }
            }
        }
    }

    // If we've added all attributes and it's still not unique, return the most specific one
    if (predicateParts.length > 1) {
        return {
            selector: `-ios predicate string:${predicateParts.join(' AND ')}`,
            warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
        }
    }

    return null
}

/**
 * Builds a unique class chain by progressively adding attributes
 */
function buildUniqueClassChain(
    type: string,
    attributes: Record<string, string>,
    attributePriority: string[],
    pageSource: string
): XPathConversionResult | null {
    const chain = `**/${type}`
    const predicateParts: string[] = []

    // Try adding attributes one by one until we get a unique selector
    for (const attr of attributePriority) {
        if (attributes[attr] !== undefined) {
            const value = attributes[attr]
            if (typeof value === 'string' && value.length > 0) {
                predicateParts.push(`${attr} == "${value}"`)
                const selector = `-ios class chain:${chain}[\`${predicateParts.join(' AND ')}\`]`
                const isUnique = isSelectorUniqueInPageSource(selector, pageSource)
                if (isUnique) {
                    return {
                        selector
                    }
                }
            }
        }
    }

    // If we've added all attributes and it's still not unique, return the most specific one
    if (predicateParts.length > 0) {
        return {
            selector: `-ios class chain:${chain}[\`${predicateParts.join(' AND ')}\`]`,
            warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
        }
    }

    // Try without predicates first
    const basicSelector = `-ios class chain:${chain}`
    const isUnique = isSelectorUniqueInPageSource(basicSelector, pageSource)
    if (isUnique) {
        return {
            selector: basicSelector
        }
    }

    return {
        selector: basicSelector,
        warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
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

