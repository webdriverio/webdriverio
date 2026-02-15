/**
 * Mobile element detection utilities for iOS and Android
 *
 * Uses page source parsing for optimal performance (2 HTTP calls vs 600+ for 50 elements)
 */

import type { ElementWithLocators, FilterOptions, LocatorStrategy } from './locators/index.js'
import { generateAllElementLocators, getDefaultFilters } from './locators/index.js'

/**
 * Element info returned by getMobileVisibleElements
 * Uses uniform fields (all elements have same keys) to enable TOON tabular format
 */
export interface MobileElementInfo {
    selector: string;
    tagName: string;
    isInViewport: boolean;
    text: string;
    resourceId: string;
    accessibilityId: string;
    isEnabled: boolean;
    altSelector: string; // Single alternative selector (flattened for tabular format)
    // Only present when includeBounds=true
    bounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Options for getMobileVisibleElements
 */
export interface GetMobileElementsOptions {
    includeContainers?: boolean;
    includeBounds?: boolean;
    filterOptions?: FilterOptions;
}

/**
 * Locator strategy priority order for selecting best selector
 * Earlier = higher priority
 */
const LOCATOR_PRIORITY: LocatorStrategy[] = [
    'accessibility-id', // Most stable, cross-platform
    'id', // Android resource-id
    'text', // Text-based (can be fragile but readable)
    'predicate-string', // iOS predicate
    'class-chain', // iOS class chain
    'uiautomator', // Android UiAutomator compound
    'xpath', // XPath (last resort, brittle)
    // 'class-name' intentionally excluded - too generic
]

/**
 * Select best locators from available strategies
 * Returns [primarySelector, ...alternativeSelectors]
 */
function selectBestLocators(locators: Record<string, string>): string[] {
    const selected: string[] = []

    // Find primary selector based on priority
    for (const strategy of LOCATOR_PRIORITY) {
        if (locators[strategy]) {
            selected.push(locators[strategy])
            break
        }
    }

    // Add one alternative if available (different strategy)
    for (const strategy of LOCATOR_PRIORITY) {
        if (locators[strategy] && !selected.includes(locators[strategy])) {
            selected.push(locators[strategy])
            break
        }
    }

    return selected
}

/**
 * Convert ElementWithLocators to MobileElementInfo
 * Uses uniform fields (all elements have same keys) to enable CSV tabular format
 */
function toMobileElementInfo(element: ElementWithLocators, includeBounds: boolean): MobileElementInfo {
    const selectedLocators = selectBestLocators(element.locators)

    // Use contentDesc for accessibilityId on Android, or name on iOS
    const accessId = element.accessibilityId || element.contentDesc

    // Build object with ALL fields for uniform schema (enables CSV tabular format)
    // Empty string '' used for missing values to keep schema consistent
    const info: MobileElementInfo = {
        selector: selectedLocators[0] || '',
        tagName: element.tagName,
        isInViewport: element.isInViewport,
        text: element.text || '',
        resourceId: element.resourceId || '',
        accessibilityId: accessId || '',
        isEnabled: element.enabled !== false,
        altSelector: selectedLocators[1] || '', // Single alternative (flattened for tabular)
    }

    // Only include bounds if explicitly requested (adds 4 extra columns)
    if (includeBounds) {
        info.bounds = element.bounds
    }

    return info
}

/**
 * Get viewport size from browser
 */
async function getViewportSize(browser: WebdriverIO.Browser): Promise<{ width: number; height: number }> {
    try {
        const size = await browser.getWindowSize()
        return { width: size.width, height: size.height }
    } catch {
        return { width: 9999, height: 9999 }
    }
}

/**
 * Get all visible elements from a mobile app
 *
 * Performance: 2 HTTP calls (getWindowSize + getPageSource) vs 12+ per element with legacy approach
 */
export async function getMobileVisibleElements(
    browser: WebdriverIO.Browser,
    platform: 'ios' | 'android',
    options: GetMobileElementsOptions = {},
): Promise<MobileElementInfo[]> {
    const { includeContainers = false, includeBounds = false, filterOptions } = options

    const viewportSize = await getViewportSize(browser)
    const pageSource = await browser.getPageSource()

    const filters: FilterOptions = {
        ...getDefaultFilters(platform, includeContainers),
        ...filterOptions,
    }

    const elements = generateAllElementLocators(pageSource, {
        platform,
        viewportSize,
        filters,
    })

    return elements.map((el) => toMobileElementInfo(el, includeBounds))
}
