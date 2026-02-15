/**
 * Mobile element locator generation
 *
 * Main orchestrator module that coordinates XML parsing, element filtering,
 * and locator generation for mobile automation.
 *
 * Based on: https://github.com/webdriverio/mcp
 */

// Types
export type {
    ElementAttributes,
    JSONElement,
    Bounds,
    FilterOptions,
    UniquenessResult,
    LocatorStrategy,
    LocatorContext,
    ElementWithLocators,
    GenerateLocatorsOptions,
} from './types.js'

// Constants
export {
    ANDROID_INTERACTABLE_TAGS,
    IOS_INTERACTABLE_TAGS,
    ANDROID_LAYOUT_CONTAINERS,
    IOS_LAYOUT_CONTAINERS,
} from './constants.js'

// XML Parsing
export {
    xmlToJSON,
    xmlToDOM,
    evaluateXPath,
    checkXPathUniqueness,
    findDOMNodeByPath,
    parseAndroidBounds,
    parseIOSBounds,
    flattenElementTree,
    countAttributeOccurrences,
    isAttributeUnique,
} from './xml-parsing.js'

// Element Filtering
export {
    isInteractableElement,
    isLayoutContainer,
    hasMeaningfulContent,
    shouldIncludeElement,
    getDefaultFilters,
} from './element-filter.js'

// Locator Generation
export {
    getSuggestedLocators,
    getBestLocator,
    locatorsToObject,
} from './locator-generation.js'

import type {
    JSONElement,
    FilterOptions,
    LocatorStrategy,
    ElementWithLocators,
    GenerateLocatorsOptions,
} from './types.js'

import { xmlToJSON, xmlToDOM, parseAndroidBounds, parseIOSBounds, findDOMNodeByPath } from './xml-parsing.js'
import { shouldIncludeElement, isLayoutContainer, hasMeaningfulContent } from './element-filter.js'
import { getSuggestedLocators, locatorsToObject } from './locator-generation.js'

interface ProcessingContext {
    sourceXML: string;
    platform: 'android' | 'ios';
    automationName: string;
    isNative: boolean;
    viewportSize: { width: number; height: number };
    filters: FilterOptions;
    results: ElementWithLocators[];
    parsedDOM: Document | null;
}

/**
 * Parse element bounds based on platform
 */
function parseBounds(
    element: JSONElement,
    platform: 'android' | 'ios',
): { x: number; y: number; width: number; height: number } {
    return platform === 'android'
        ? parseAndroidBounds(element.attributes.bounds || '')
        : parseIOSBounds(element.attributes)
}

/**
 * Check if bounds are within viewport
 */
function isWithinViewport(
    bounds: { x: number; y: number; width: number; height: number },
    viewport: { width: number; height: number },
): boolean {
    return (
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.width > 0 &&
        bounds.height > 0 &&
        bounds.x + bounds.width <= viewport.width &&
        bounds.y + bounds.height <= viewport.height
    )
}

/**
 * Transform JSONElement to ElementWithLocators
 */
function transformElement(
    element: JSONElement,
    locators: [LocatorStrategy, string][],
    ctx: ProcessingContext,
): ElementWithLocators {
    const attrs = element.attributes
    const bounds = parseBounds(element, ctx.platform)

    return {
        tagName: element.tagName,
        locators: locatorsToObject(locators),
        text: attrs.text || attrs.label || '',
        contentDesc: attrs['content-desc'] || '',
        resourceId: attrs['resource-id'] || '',
        accessibilityId: attrs.name || attrs['content-desc'] || '',
        label: attrs.label || '',
        value: attrs.value || '',
        className: attrs.class || element.tagName,
        clickable: attrs.clickable === 'true' || attrs.accessible === 'true' || attrs['long-clickable'] === 'true',
        enabled: attrs.enabled !== 'false',
        displayed: ctx.platform === 'android' ? attrs.displayed !== 'false' : attrs.visible !== 'false',
        bounds,
        isInViewport: isWithinViewport(bounds, ctx.viewportSize),
    }
}

/**
 * Check if element should be processed
 */
function shouldProcess(element: JSONElement, ctx: ProcessingContext): boolean {
    if (shouldIncludeElement(element, ctx.filters, ctx.isNative, ctx.automationName)) {
        return true
    }
    return isLayoutContainer(element, ctx.platform) && hasMeaningfulContent(element, ctx.platform)
}

/**
 * Process a single element and add to results if valid
 */
function processElement(element: JSONElement, ctx: ProcessingContext): void {
    if (!shouldProcess(element, ctx)) {
        return
    }

    try {
        const targetNode = ctx.parsedDOM ? findDOMNodeByPath(ctx.parsedDOM, element.path) : undefined

        const locators = getSuggestedLocators(
            element,
            ctx.sourceXML,
            ctx.automationName,
            { sourceXML: ctx.sourceXML, parsedDOM: ctx.parsedDOM, isAndroid: ctx.platform === 'android' },
            targetNode || undefined,
        )
        if (locators.length === 0) {
            return
        }

        const transformed = transformElement(element, locators, ctx)
        if (Object.keys(transformed.locators).length === 0) {
            return
        }

        ctx.results.push(transformed)
    } catch (error) {
        console.error(`[processElement] Error at path ${element.path}:`, error)
    }
}

/**
 * Recursively traverse and process element tree
 */
function traverseTree(element: JSONElement | null, ctx: ProcessingContext): void {
    if (!element) {
        return
    }

    processElement(element, ctx)

    for (const child of element.children || []) {
        traverseTree(child, ctx)
    }
}

/**
 * Generate locators for all elements from page source XML
 */
export function generateAllElementLocators(
    sourceXML: string,
    options: GenerateLocatorsOptions,
): ElementWithLocators[] {
    const sourceJSON = xmlToJSON(sourceXML)

    if (!sourceJSON) {
        console.error('[generateAllElementLocators] Failed to parse page source XML')
        return []
    }

    const parsedDOM = xmlToDOM(sourceXML)

    const ctx: ProcessingContext = {
        sourceXML,
        platform: options.platform,
        automationName: options.platform === 'android' ? 'uiautomator2' : 'xcuitest',
        isNative: options.isNative ?? true,
        viewportSize: options.viewportSize ?? { width: 9999, height: 9999 },
        filters: options.filters ?? {},
        results: [],
        parsedDOM,
    }

    traverseTree(sourceJSON, ctx)

    return ctx.results
}
