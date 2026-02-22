import type { ElementData, XPathConversionResult } from './xpath-types.js'
import { MEANINGFUL_ATTRIBUTES, BOOLEAN_ATTRIBUTES, ATTRIBUTE_PRIORITY } from './xpath-constants.js'
import { isSelectorUniqueInPageSource } from './xpath-page-source.js'

/**
 * Builds optimal selector from element data, ensuring uniqueness.
 * Priority: Accessibility ID > Predicate String > Class Chain
 *
 * @param elementData - Element data extracted from page source
 * @param pageSource - The page source XML to test selector uniqueness against
 * @returns Conversion result with unique selector, or warning if not unique
 */
export function buildSelectorFromElementData(
    elementData: ElementData,
    pageSource: string
): XPathConversionResult | null {
    const { type, attributes } = elementData

    // 1. Try Accessibility ID (highest priority)
    const name = attributes.name || attributes.label
    if (name) {
        const accessibilitySelector = `~${name}`
        if (isSelectorUniqueInPageSource(accessibilitySelector, pageSource)) {
            return { selector: accessibilitySelector }
        }
    }

    // 2. Try Predicate String
    if (type) {
        const predicateResult = buildUniquePredicateString(type, attributes, pageSource)
        if (predicateResult) {
            return predicateResult
        }
    }

    // 3. Try Class Chain
    if (type) {
        const classChainResult = buildUniqueClassChain(type, attributes, pageSource)
        if (classChainResult) {
            return classChainResult
        }
    }

    return {
        selector: null,
        warning: 'Could not generate a unique selector from element data. Multiple elements may match the suggested selector.'
    }
}

/**
 * Builds a unique predicate string by progressively adding attributes.
 * Skips redundant attributes (e.g., if name == label, only include one).
 */
function buildUniquePredicateString(
    type: string,
    attributes: Record<string, string>,
    pageSource: string
): XPathConversionResult | null {
    const predicateParts: string[] = [`type == '${type}'`]

    // Check if just the type is unique
    let selector = `-ios predicate string:${predicateParts.join(' AND ')}`
    if (isSelectorUniqueInPageSource(selector, pageSource)) {
        return { selector }
    }

    // Check if name and label are the same
    const name = attributes.name
    const label = attributes.label
    const nameEqualsLabel = name && label && name === label

    // Try adding meaningful attributes first
    for (const attr of MEANINGFUL_ATTRIBUTES) {
        if (attr === 'label' && nameEqualsLabel) {
            continue
        }

        if (attributes[attr] !== undefined) {
            const value = attributes[attr]
            if (typeof value === 'string' && value.length > 0) {
                predicateParts.push(`${attr} == '${value}'`)
                selector = `-ios predicate string:${predicateParts.join(' AND ')}`
                if (isSelectorUniqueInPageSource(selector, pageSource)) {
                    return { selector }
                }
            }
        }
    }

    // Try adding boolean attributes (only if 'true')
    for (const attr of BOOLEAN_ATTRIBUTES) {
        if (attributes[attr] === 'true') {
            predicateParts.push(`${attr} == 'true'`)
            selector = `-ios predicate string:${predicateParts.join(' AND ')}`
            if (isSelectorUniqueInPageSource(selector, pageSource)) {
                return { selector }
            }
        }
    }

    // Return best effort with warning
    const meaningfulOnlyParts = predicateParts.filter(part => {
        const attr = part.split(' == ')[0]
        return !BOOLEAN_ATTRIBUTES.includes(attr as typeof BOOLEAN_ATTRIBUTES[number])
    })

    if (meaningfulOnlyParts.length > 1) {
        return {
            selector: `-ios predicate string:${meaningfulOnlyParts.join(' AND ')}`,
            warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
        }
    }

    if (predicateParts.length > 1) {
        return {
            selector: `-ios predicate string:${predicateParts.join(' AND ')}`,
            warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
        }
    }

    return null
}

/**
 * Builds a unique class chain by progressively adding attributes.
 */
function buildUniqueClassChain(
    type: string,
    attributes: Record<string, string>,
    pageSource: string
): XPathConversionResult | null {
    const chain = `**/${type}`
    const predicateParts: string[] = []

    // Try adding attributes one by one
    for (const attr of ATTRIBUTE_PRIORITY) {
        if (attributes[attr] !== undefined) {
            const value = attributes[attr]
            if (typeof value === 'string' && value.length > 0) {
                predicateParts.push(`${attr} == "${value}"`)
                const selector = `-ios class chain:${chain}[\`${predicateParts.join(' AND ')}\`]`
                if (isSelectorUniqueInPageSource(selector, pageSource)) {
                    return { selector }
                }
            }
        }
    }

    // Return most specific one we have
    if (predicateParts.length > 0) {
        return {
            selector: `-ios class chain:${chain}[\`${predicateParts.join(' AND ')}\`]`,
            warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
        }
    }

    // Try without predicates
    const basicSelector = `-ios class chain:${chain}`
    if (isSelectorUniqueInPageSource(basicSelector, pageSource)) {
        return { selector: basicSelector }
    }

    return {
        selector: basicSelector,
        warning: 'Selector may match multiple elements. Consider adding more specific attributes.'
    }
}
