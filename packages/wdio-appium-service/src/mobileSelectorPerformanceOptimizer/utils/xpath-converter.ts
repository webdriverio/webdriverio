import logger from '@wdio/logger'

import type { XPathConversionResult, XPathConversionOptions } from './xpath-types.js'
import { detectUnmappableXPathFeatures, isComplexXPath } from './xpath-detection.js'
import { convertXPathToAccessibilityId, convertXPathToPredicateString } from './xpath-predicate.js'
import { convertXPathToClassChain } from './xpath-class-chain.js'
import { parseElementFromPageSource } from './xpath-page-source.js'
import { buildSelectorFromElementData } from './xpath-selector-builder.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Converts an XPath selector to an optimized alternative selector.
 * Priority: Accessibility ID > Predicate String > Class Chain
 *
 * @param xpath - The XPath selector to convert
 * @param options - Conversion options including browser instance for dynamic analysis
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
        const dynamicResult = buildSelectorFromElementData(elementData, pageSource)

        if (dynamicResult && dynamicResult.selector) {
            return dynamicResult
        }

        return staticResult
    } catch (error) {
        log.debug(`Dynamic XPath analysis failed, falling back to static conversion: ${error instanceof Error ? error.message : String(error)}`)
        return staticResult
    }
}
