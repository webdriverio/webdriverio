/**
 * Locator strategy generation for mobile elements
 */

import type { JSONElement, LocatorStrategy, LocatorContext, UniquenessResult } from './types.js'
import { checkXPathUniqueness, evaluateXPath, isAttributeUnique } from './xml-parsing.js'

/**
 * Check if a string value is valid for use in a locator
 */
function isValidValue(value: string | undefined): value is string {
    return value !== undefined && value !== null && value !== 'null' && value.trim() !== ''
}

/**
 * Escape special characters in text for use in selectors
 */
function escapeText(text: string): string {
    return text.replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Escape value for use in XPath expressions
 */
function escapeXPathValue(value: string): string {
    if (!value.includes("'")) {
        return `'${value}'`
    }
    if (!value.includes('"')) {
        return `"${value}"`
    }
    const parts: string[] = []
    let current = ''
    for (const char of value) {
        if (char === "'") {
            if (current) {
                parts.push(`'${current}'`)
            }
            parts.push('"\'"')
            current = ''
        } else {
            current += char
        }
    }
    if (current) {
        parts.push(`'${current}'`)
    }
    return `concat(${parts.join(',')})`
}

/**
 * Wrap non-unique XPath with index
 */
function generateIndexedXPath(baseXPath: string, index: number): string {
    return `(${baseXPath})[${index}]`
}

/**
 * Add .instance(n) for UiAutomator (0-based)
 */
function generateIndexedUiAutomator(baseSelector: string, index: number): string {
    return `${baseSelector}.instance(${index - 1})`
}

/**
 * Check uniqueness, falling back to regex if no DOM available
 */
function checkUniqueness(
    ctx: LocatorContext,
    xpathStr: string,
    targetNode?: Node,
): UniquenessResult {
    if (ctx.parsedDOM) {
        return checkXPathUniqueness(ctx.parsedDOM, xpathStr, targetNode)
    }

    const match = xpathStr.match(/\/\/\*\[@([^=]+)="([^"]+)"\]/)
    if (match) {
        const [, attr, value] = match
        return { isUnique: isAttributeUnique(ctx.sourceXML, attr, value) }
    }
    return { isUnique: false }
}

/**
 * Get sibling index (1-based) among same-tag siblings
 */
function getSiblingIndex(element: Element): number {
    const parent = element.parentNode
    if (!parent) {
        return 1
    }

    const tagName = element.nodeName
    let index = 0

    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes.item(i)
        if (child?.nodeType === 1 && child.nodeName === tagName) {
            index++
            if (child === element) {
                return index
            }
        }
    }

    return 1
}

/**
 * Count siblings with same tag name
 */
function countSiblings(element: Element): number {
    const parent = element.parentNode
    if (!parent) {
        return 1
    }

    const tagName = element.nodeName
    let count = 0

    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes.item(i)
        if (child?.nodeType === 1 && child.nodeName === tagName) {
            count++
        }
    }

    return count
}

/**
 * Find unique attribute for element in XPath format
 */
function findUniqueAttribute(element: Element, ctx: LocatorContext): string | null {
    const attrs = ctx.isAndroid
        ? ['resource-id', 'content-desc', 'text']
        : ['name', 'label', 'value']

    for (const attr of attrs) {
        const value = element.getAttribute(attr)
        if (value && value.trim()) {
            const xpathStr = `//*[@${attr}=${escapeXPathValue(value)}]`
            const result = ctx.parsedDOM
                ? checkXPathUniqueness(ctx.parsedDOM, xpathStr)
                : { isUnique: isAttributeUnique(ctx.sourceXML, attr, value) }

            if (result.isUnique) {
                return `@${attr}=${escapeXPathValue(value)}`
            }
        }
    }

    return null
}

/**
 * Build hierarchical XPath by traversing up the DOM tree
 */
function buildHierarchicalXPath(
    ctx: LocatorContext,
    element: Element,
    maxDepth: number = 3,
): string | null {
    if (!ctx.parsedDOM) {
        return null
    }

    const pathParts: string[] = []
    let current: Element | null = element
    let depth = 0

    while (current && depth < maxDepth) {
        const tagName = current.nodeName
        const uniqueAttr = findUniqueAttribute(current, ctx)

        if (uniqueAttr) {
            pathParts.unshift(`//${tagName}[${uniqueAttr}]`)
            break
        } else {
            const siblingIndex = getSiblingIndex(current)
            const siblingCount = countSiblings(current)

            if (siblingCount > 1) {
                pathParts.unshift(`${tagName}[${siblingIndex}]`)
            } else {
                pathParts.unshift(tagName)
            }
        }

        const parent = current.parentNode as Element | null
        current = parent && parent.nodeType === 1 ? parent : null
        depth++
    }

    if (pathParts.length === 0) {
        return null
    }

    let result = pathParts[0]
    for (let i = 1; i < pathParts.length; i++) {
        result += '/' + pathParts[i]
    }

    if (!result.startsWith('//')) {
        result = '//' + result
    }

    return result
}

/**
 * Add XPath locator with uniqueness checking and fallbacks
 */
function addXPathLocator(
    results: [LocatorStrategy, string][],
    xpathStr: string,
    ctx: LocatorContext,
    targetNode?: Node,
): void {
    const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)
    if (uniqueness.isUnique) {
        results.push(['xpath', xpathStr])
    } else if (uniqueness.index) {
        results.push(['xpath', generateIndexedXPath(xpathStr, uniqueness.index)])
    } else {
        if (targetNode && ctx.parsedDOM) {
            const hierarchical = buildHierarchicalXPath(ctx, targetNode as Element)
            if (hierarchical) {
                results.push(['xpath', hierarchical])
            }
        }
        results.push(['xpath', xpathStr])
    }
}

/**
 * Check if element is within UiAutomator scope
 */
function isInUiAutomatorScope(element: JSONElement, doc: Document | null): boolean {
    if (!doc) {
        return true
    }

    const hierarchyNodes = evaluateXPath(doc, '/hierarchy/*')
    if (hierarchyNodes.length === 0) {
        return true
    }

    const lastIndex = hierarchyNodes.length
    const pathParts = element.path.split('.')
    if (pathParts.length === 0 || pathParts[0] === '') {
        return true
    }

    const firstIndex = parseInt(pathParts[0], 10)
    return firstIndex === lastIndex - 1
}

/**
 * Build Android UiAutomator selector with multiple attributes
 */
function buildUiAutomatorSelector(element: JSONElement): string | null {
    const attrs = element.attributes
    const parts: string[] = []

    if (isValidValue(attrs['resource-id'])) {
        parts.push(`resourceId("${attrs['resource-id']}")`)
    }
    if (isValidValue(attrs.text) && attrs.text!.length < 100) {
        parts.push(`text("${escapeText(attrs.text!)}")`)
    }
    if (isValidValue(attrs['content-desc'])) {
        parts.push(`description("${attrs['content-desc']}")`)
    }
    if (isValidValue(attrs.class)) {
        parts.push(`className("${attrs.class}")`)
    }

    if (parts.length === 0) {
        return null
    }

    return `android=new UiSelector().${parts.join('.')}`
}

/**
 * Build iOS predicate string with multiple conditions
 */
function buildPredicateString(element: JSONElement): string | null {
    const attrs = element.attributes
    const conditions: string[] = []

    if (isValidValue(attrs.name)) {
        conditions.push(`name == "${escapeText(attrs.name!)}"`)
    }
    if (isValidValue(attrs.label)) {
        conditions.push(`label == "${escapeText(attrs.label!)}"`)
    }
    if (isValidValue(attrs.value)) {
        conditions.push(`value == "${escapeText(attrs.value!)}"`)
    }
    if (attrs.visible === 'true') {
        conditions.push('visible == 1')
    }
    if (attrs.enabled === 'true') {
        conditions.push('enabled == 1')
    }

    if (conditions.length === 0) {
        return null
    }

    return `-ios predicate string:${conditions.join(' AND ')}`
}

/**
 * Build iOS class chain selector
 */
function buildClassChain(element: JSONElement): string | null {
    const attrs = element.attributes
    const tagName = element.tagName

    if (!tagName.startsWith('XCUI')) {
        return null
    }

    let selector = `**/${tagName}`

    if (isValidValue(attrs.label)) {
        selector += `[\`label == "${escapeText(attrs.label!)}"\`]`
    } else if (isValidValue(attrs.name)) {
        selector += `[\`name == "${escapeText(attrs.name!)}"\`]`
    }

    return `-ios class chain:${selector}`
}

/**
 * Build XPath for element with unique identification
 */
function buildXPath(element: JSONElement, _sourceXML: string, isAndroid: boolean): string | null {
    const attrs = element.attributes
    const tagName = element.tagName
    const conditions: string[] = []

    if (isAndroid) {
        if (isValidValue(attrs['resource-id'])) {
            conditions.push(`@resource-id="${attrs['resource-id']}"`)
        }
        if (isValidValue(attrs['content-desc'])) {
            conditions.push(`@content-desc="${attrs['content-desc']}"`)
        }
        if (isValidValue(attrs.text) && attrs.text!.length < 100) {
            conditions.push(`@text="${escapeText(attrs.text!)}"`)
        }
    } else {
        if (isValidValue(attrs.name)) {
            conditions.push(`@name="${attrs.name}"`)
        }
        if (isValidValue(attrs.label)) {
            conditions.push(`@label="${attrs.label}"`)
        }
        if (isValidValue(attrs.value)) {
            conditions.push(`@value="${attrs.value}"`)
        }
    }

    if (conditions.length === 0) {
        return `//${tagName}`
    }

    return `//${tagName}[${conditions.join(' and ')}]`
}

/**
 * Get simple locators based on single attributes
 */
function getSimpleSuggestedLocators(
    element: JSONElement,
    ctx: LocatorContext,
    automationName: string,
    targetNode?: Node,
): [LocatorStrategy, string][] {
    const results: [LocatorStrategy, string][] = []
    const isAndroid = automationName.toLowerCase().includes('uiautomator')
    const attrs = element.attributes
    const inUiAutomatorScope = isAndroid ? isInUiAutomatorScope(element, ctx.parsedDOM) : true

    if (isAndroid) {
        // Resource ID
        const resourceId = attrs['resource-id']
        if (isValidValue(resourceId)) {
            const xpathStr = `//*[@resource-id="${resourceId}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique && inUiAutomatorScope) {
                results.push(['id', `android=new UiSelector().resourceId("${resourceId}")`])
            } else if (uniqueness.index && inUiAutomatorScope) {
                const base = `android=new UiSelector().resourceId("${resourceId}")`
                results.push(['id', generateIndexedUiAutomator(base, uniqueness.index)])
            }
        }

        // Content Description
        const contentDesc = attrs['content-desc']
        if (isValidValue(contentDesc)) {
            const xpathStr = `//*[@content-desc="${contentDesc}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique) {
                results.push(['accessibility-id', `~${contentDesc}`])
            }
        }

        // Text
        const text = attrs.text
        if (isValidValue(text) && text.length < 100) {
            const xpathStr = `//*[@text="${escapeText(text)}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique && inUiAutomatorScope) {
                results.push(['text', `android=new UiSelector().text("${escapeText(text)}")`])
            } else if (uniqueness.index && inUiAutomatorScope) {
                const base = `android=new UiSelector().text("${escapeText(text)}")`
                results.push(['text', generateIndexedUiAutomator(base, uniqueness.index)])
            }
        }
    } else {
        // iOS: Accessibility ID (name)
        const name = attrs.name
        if (isValidValue(name)) {
            const xpathStr = `//*[@name="${name}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique) {
                results.push(['accessibility-id', `~${name}`])
            }
        }

        // iOS: Label
        const label = attrs.label
        if (isValidValue(label) && label !== attrs.name) {
            const xpathStr = `//*[@label="${escapeText(label)}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique) {
                results.push(['predicate-string', `-ios predicate string:label == "${escapeText(label)}"`])
            }
        }

        // iOS: Value
        const value = attrs.value
        if (isValidValue(value)) {
            const xpathStr = `//*[@value="${escapeText(value)}"]`
            const uniqueness = checkUniqueness(ctx, xpathStr, targetNode)

            if (uniqueness.isUnique) {
                results.push(['predicate-string', `-ios predicate string:value == "${escapeText(value)}"`])
            }
        }
    }

    return results
}

/**
 * Get complex locators (combinations, XPath, etc.)
 */
function getComplexSuggestedLocators(
    element: JSONElement,
    ctx: LocatorContext,
    automationName: string,
    targetNode?: Node,
): [LocatorStrategy, string][] {
    const results: [LocatorStrategy, string][] = []
    const isAndroid = automationName.toLowerCase().includes('uiautomator')
    const inUiAutomatorScope = isAndroid ? isInUiAutomatorScope(element, ctx.parsedDOM) : true

    if (isAndroid) {
        if (inUiAutomatorScope) {
            const uiAutomator = buildUiAutomatorSelector(element)
            if (uiAutomator) {
                results.push(['uiautomator', uiAutomator])
            }
        }

        const xpathStr = buildXPath(element, ctx.sourceXML, true)
        if (xpathStr) {
            addXPathLocator(results, xpathStr, ctx, targetNode)
        }

        if (inUiAutomatorScope && isValidValue(element.attributes.class)) {
            results.push([
                'class-name',
                `android=new UiSelector().className("${element.attributes.class}")`,
            ])
        }
    } else {
        const predicate = buildPredicateString(element)
        if (predicate) {
            results.push(['predicate-string', predicate])
        }

        const classChain = buildClassChain(element)
        if (classChain) {
            results.push(['class-chain', classChain])
        }

        const xpathStr = buildXPath(element, ctx.sourceXML, false)
        if (xpathStr) {
            addXPathLocator(results, xpathStr, ctx, targetNode)
        }

        const type = element.tagName
        if (type.startsWith('XCUIElementType')) {
            results.push(['class-name', `-ios class chain:**/${type}`])
        }
    }

    return results
}

/**
 * Get all suggested locators for an element
 */
export function getSuggestedLocators(
    element: JSONElement,
    sourceXML: string,
    automationName: string,
    ctx?: LocatorContext,
    targetNode?: Node,
): [LocatorStrategy, string][] {
    const locatorCtx = ctx ?? {
        sourceXML,
        parsedDOM: null,
        isAndroid: automationName.toLowerCase().includes('uiautomator'),
    }

    const simpleLocators = getSimpleSuggestedLocators(element, locatorCtx, automationName, targetNode)
    const complexLocators = getComplexSuggestedLocators(element, locatorCtx, automationName, targetNode)

    const seen = new Set<string>()
    const results: [LocatorStrategy, string][] = []

    for (const locator of [...simpleLocators, ...complexLocators]) {
        if (!seen.has(locator[1])) {
            seen.add(locator[1])
            results.push(locator)
        }
    }

    return results
}

/**
 * Get the best (first priority) locator for an element
 */
export function getBestLocator(
    element: JSONElement,
    sourceXML: string,
    automationName: string,
): string | null {
    const locators = getSuggestedLocators(element, sourceXML, automationName)
    return locators.length > 0 ? locators[0][1] : null
}

/**
 * Convert locator array to object format
 */
export function locatorsToObject(locators: [LocatorStrategy, string][]): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [strategy, value] of locators) {
        if (!result[strategy]) {
            result[strategy] = value
        }
    }
    return result
}
