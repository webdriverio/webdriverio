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
 * Options for XPath conversion
 */
export interface XPathConversionOptions {
    /**
     * Browser instance for page source analysis.
     * Used to execute XPath and build optimized selectors with uniqueness validation.
     */
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
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
