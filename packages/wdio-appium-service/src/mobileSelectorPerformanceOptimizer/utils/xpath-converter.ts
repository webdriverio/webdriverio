import logger from '@wdio/logger'

import type { XPathConversionResult, XPathConversionOptions } from './xpath-types.js'
import { detectUnmappableXPathFeatures } from './xpath-detection.js'
import { buildSelectorFromElementData } from './xpath-selector-builder.js'
import { findElementByXPathWithFallback } from './xpath-page-source-executor.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Converts an XPath selector to an optimized alternative selector.
 * Priority: Accessibility ID > Predicate String > Class Chain
 *
 * Uses page source analysis to find the exact element and build an optimized
 * selector with uniqueness validation.
 *
 * @param xpath - The XPath selector to convert
 * @param options - Conversion options including browser instance for page source analysis
 * @returns Conversion result with selector and optional warning, or null if conversion isn't possible.
 */
export async function convertXPathToOptimizedSelector(
    xpath: string,
    options: XPathConversionOptions
): Promise<XPathConversionResult | null> {
    if (!xpath || typeof xpath !== 'string') {
        return null
    }

    const unmappableFeatures = detectUnmappableXPathFeatures(xpath)
    const hasUnmappableFeatures = unmappableFeatures.length > 0
    const unmappableWarning = hasUnmappableFeatures
        ? `XPath contains unmappable features: ${unmappableFeatures.join(', ')}.`
        : undefined

    try {
        const browserWithPageSource = options.browser as WebdriverIO.Browser & {
            getPageSource: () => Promise<string>
        }
        const pageSource = await browserWithPageSource.getPageSource()

        if (!pageSource || typeof pageSource !== 'string') {
            return {
                selector: null,
                warning: hasUnmappableFeatures
                    ? `${unmappableWarning} Page source unavailable.`
                    : 'Page source unavailable.'
            }
        }

        const result = findElementByXPathWithFallback(xpath, pageSource)

        if (!result) {
            return {
                selector: null,
                warning: hasUnmappableFeatures
                    ? `${unmappableWarning} Element not found in page source.`
                    : 'Element not found in page source.'
            }
        }

        const { element, matchCount } = result
        const selectorResult = buildSelectorFromElementData(element, pageSource)

        if (!selectorResult || !selectorResult.selector) {
            return {
                selector: null,
                warning: hasUnmappableFeatures
                    ? `${unmappableWarning} Could not build selector from element attributes.`
                    : 'Could not build selector from element attributes.'
            }
        }

        if (matchCount > 1) {
            return {
                selector: null,
                warning: `XPath matched ${matchCount} elements. The suggested selector may not be unique. You can use this selector but be aware it may match multiple elements.`,
                suggestion: selectorResult.selector
            }
        }

        return selectorResult
    } catch (error) {
        log.debug(`Page source analysis failed: ${error instanceof Error ? error.message : String(error)}`)
        return {
            selector: null,
            warning: hasUnmappableFeatures
                ? `${unmappableWarning} Page source analysis failed.`
                : 'Page source analysis failed.'
        }
    }
}
