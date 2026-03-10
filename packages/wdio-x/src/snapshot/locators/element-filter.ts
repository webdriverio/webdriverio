/**
 * Element filtering logic for mobile automation
 */

import type { JSONElement, FilterOptions } from './types.js'
import {
    ANDROID_INTERACTABLE_TAGS,
    IOS_INTERACTABLE_TAGS,
    ANDROID_LAYOUT_CONTAINERS,
    IOS_LAYOUT_CONTAINERS,
} from './constants.js'

/**
 * Check if element tag matches any in the list (handles partial matches)
 */
function matchesTagList(tagName: string, tagList: string[]): boolean {
    if (tagList.includes(tagName)) {
        return true
    }

    for (const tag of tagList) {
        if (tagName.endsWith(tag) || tagName.includes(tag)) {
            return true
        }
    }

    return false
}

/**
 * Check if element matches tag name filters
 */
function matchesTagFilters(
    element: JSONElement,
    includeTagNames: string[],
    excludeTagNames: string[],
): boolean {
    if (includeTagNames.length > 0 && !matchesTagList(element.tagName, includeTagNames)) {
        return false
    }

    if (matchesTagList(element.tagName, excludeTagNames)) {
        return false
    }

    return true
}

/**
 * Check if element matches attribute-based filters
 */
function matchesAttributeFilters(
    element: JSONElement,
    requireAttributes: string[],
    minAttributeCount: number,
): boolean {
    if (requireAttributes.length > 0) {
        const hasRequiredAttr = requireAttributes.some((attr) => element.attributes?.[attr])
        if (!hasRequiredAttr) {
            return false
        }
    }

    if (element.attributes && minAttributeCount > 0) {
        const attrCount = Object.values(element.attributes).filter(
            (v) => v !== undefined && v !== null && v !== '',
        ).length
        if (attrCount < minAttributeCount) {
            return false
        }
    }

    return true
}

/**
 * Check if element is interactable based on platform
 */
export function isInteractableElement(
    element: JSONElement,
    isNative: boolean,
    automationName: string,
): boolean {
    const isAndroid = automationName.toLowerCase().includes('uiautomator')
    const interactableTags = isAndroid ? ANDROID_INTERACTABLE_TAGS : IOS_INTERACTABLE_TAGS

    if (matchesTagList(element.tagName, interactableTags)) {
        return true
    }

    if (isAndroid) {
        if (
            element.attributes?.clickable === 'true' ||
            element.attributes?.focusable === 'true' ||
            element.attributes?.checkable === 'true' ||
            element.attributes?.['long-clickable'] === 'true'
        ) {
            return true
        }
    }

    if (!isAndroid) {
        if (element.attributes?.accessible === 'true') {
            return true
        }
    }

    return false
}

/**
 * Check if element is a layout container
 */
export function isLayoutContainer(element: JSONElement, platform: 'android' | 'ios'): boolean {
    const containerList = platform === 'android' ? ANDROID_LAYOUT_CONTAINERS : IOS_LAYOUT_CONTAINERS
    return matchesTagList(element.tagName, containerList)
}

/**
 * Check if element has meaningful content (text, accessibility info)
 */
export function hasMeaningfulContent(
    element: JSONElement,
    platform: 'android' | 'ios',
): boolean {
    const attrs = element.attributes

    if (attrs.text && attrs.text.trim() !== '' && attrs.text !== 'null') {
        return true
    }

    if (platform === 'android') {
        if (attrs['content-desc'] && attrs['content-desc'].trim() !== '' && attrs['content-desc'] !== 'null') {
            return true
        }
    } else {
        if (attrs.label && attrs.label.trim() !== '' && attrs.label !== 'null') {
            return true
        }
        if (attrs.name && attrs.name.trim() !== '' && attrs.name !== 'null') {
            return true
        }
    }

    return false
}

/**
 * Determine if an element should be included based on all filter criteria
 */
export function shouldIncludeElement(
    element: JSONElement,
    filters: FilterOptions,
    isNative: boolean,
    automationName: string,
): boolean {
    const {
        includeTagNames = [],
        excludeTagNames = ['hierarchy'],
        requireAttributes = [],
        minAttributeCount = 0,
        fetchableOnly = false,
        clickableOnly = false,
        visibleOnly = true,
    } = filters

    if (!matchesTagFilters(element, includeTagNames, excludeTagNames)) {
        return false
    }

    if (!matchesAttributeFilters(element, requireAttributes, minAttributeCount)) {
        return false
    }

    if (clickableOnly && element.attributes?.clickable !== 'true') {
        return false
    }

    if (visibleOnly) {
        const isAndroid = automationName.toLowerCase().includes('uiautomator')
        if (isAndroid && element.attributes?.displayed === 'false') {
            return false
        }
        if (!isAndroid && element.attributes?.visible === 'false') {
            return false
        }
    }

    if (fetchableOnly && !isInteractableElement(element, isNative, automationName)) {
        return false
    }

    return true
}

/**
 * Get default filter options for a platform
 */
export function getDefaultFilters(
    platform: 'android' | 'ios',
    includeContainers: boolean = false,
): FilterOptions {
    const layoutContainers = platform === 'android' ? ANDROID_LAYOUT_CONTAINERS : IOS_LAYOUT_CONTAINERS

    return {
        excludeTagNames: includeContainers ? ['hierarchy'] : ['hierarchy', ...layoutContainers],
        fetchableOnly: !includeContainers,
        visibleOnly: true,
        clickableOnly: false,
    }
}
