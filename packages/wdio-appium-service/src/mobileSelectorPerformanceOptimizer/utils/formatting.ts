import type { SelectorLocation } from './selector-location.js'
import { INDENT_LEVEL_1, INDENT_LEVEL_2, LOG_PREFIX } from './constants.js'

/**
 * Formats a selector for display/logging purposes (truncates long selectors).
 */
export function formatSelectorForDisplay(selector: string | object, maxLength: number = 100): string {
    if (typeof selector === 'string') {
        if (selector.length > maxLength) {
            return selector.substring(0, maxLength) + '...'
        }
        return selector
    }

    return String(selector)
}

/**
 * Formats selector locations into a human-readable string for CLI output.
 * Handles single, multiple, and no locations.
 */
export function formatSelectorLocations(locations: SelectorLocation[]): string {
    if (locations.length === 0) {
        return ''
    }

    if (locations.length === 1) {
        const loc = locations[0]
        const fileDisplay = loc.isPageObject ? `${loc.file} (page object)` : loc.file
        return ` at ${fileDisplay}:${loc.line}`
    }

    const locationStrings = locations.map(loc => {
        const fileDisplay = loc.isPageObject ? `${loc.file} (page object)` : loc.file
        return `${fileDisplay}:${loc.line}`
    })

    return ` at multiple locations:\n${INDENT_LEVEL_2}   - ${locationStrings.join(`\n${INDENT_LEVEL_2}   - `)}\n${INDENT_LEVEL_2}   Note: The selector was found in ${locations.length} files. Please verify which one is correct.`
}

/**
 * Logs the optimization conclusion.
 */
export function logOptimizationConclusion(
    timeDifference: number,
    improvementPercent: number,
    originalSelector: string,
    optimizedSelector: string,
    locationInfo: string = ''
): void {
    const formattedOriginal = formatSelectorForDisplay(originalSelector)
    const formattedOptimized = formatSelectorForDisplay(optimizedSelector)
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

    if (timeDifference > 0) {
        console.log(`🚀 [${LOG_PREFIX}: Conclusion] Optimized selector is ${timeDifference.toFixed(2)}ms faster than XPath (${improvementPercent.toFixed(1)}% improvement)`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] Consider using the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better performance${locationInfo ? locationInfo : ''}.`)
    } else if (timeDifference < 0) {
        console.log(`⚠️ [${LOG_PREFIX}: Conclusion] Optimized selector is ${Math.abs(timeDifference).toFixed(2)}ms slower than XPath`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] There is no improvement in performance, consider using the original selector '${formattedOriginal}' if performance is critical. If performance is not critical, you can use the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better stability${locationInfo ? locationInfo : ''}.`)
    } else {
        console.log(`📊 [${LOG_PREFIX}: Conclusion] Optimized selector has the same performance as XPath`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] There is no improvement in performance, consider using the original selector '${formattedOriginal}' if performance is critical. If performance is not critical, you can use the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better stability${locationInfo ? locationInfo : ''}.`)
    }
}
