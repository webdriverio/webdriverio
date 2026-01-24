/**
 * Result of XPath conversion attempt
 */
export interface XPathConversionResult {
    selector: string | null
    warning?: string
    /**
     * When an XPath cannot be converted but we found a potential selector via page source analysis,
     * this field contains that selector as a suggestion (even if it's not unique).
     */
    suggestion?: string
}

/**
 * Condition extracted from XPath expression
 */
export interface XPathCondition {
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
 * Element data extracted from page source
 */
export interface ElementData {
    type: string
    attributes: Record<string, string>
}

/**
 * Predicate condition for matching elements
 */
export interface PredicateCondition {
    attr: string
    op: string
    value: string
}

/**
 * Represents a single segment of a parsed XPath expression
 */
export interface XPathSegment {
    /**
     * The axis used: '//' for descendant, '/' for child
     **/
    axis: '//' | '/'
    /**
     * The element type or '*' for wildcard
     **/
    element: string
    /**
     * Conditions/predicates for this segment
     **/
    conditions: XPathCondition[]
    /**
     * Positional index if specified (e.g., [1])
     **/
    index?: number
}
