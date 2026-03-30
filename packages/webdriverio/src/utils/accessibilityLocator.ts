/**
 * Accessibility Locator for computed accessibility selectors
 *
 * Uses in-page script execution (via BiDi `script.callFunction` or WebDriver Classic execute)
 * to find elements by computed accessible name and/or role.
 *
 * Strictness:
 * - Default: false (returns first match, like document.querySelector)
 * - 'warn': Logs warning if multiple matches, returns first
 * - true: Throws StrictSelectorError if multiple matches (aligns with Playwright/Cypress)
 *
 * Note: BiDi does not yet support accessibility locators natively, so we use script execution.
 */
import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { StrictSelectorError } from '../errors/StrictSelectorError.js'
import computeAccessibilityScript from '../scripts/computeAccessibility.js'

const log = logger('webdriverio')

export interface AccessibilitySelector {
    name: string
    role?: string
}
export interface AccessibilityOptions {
    a11yStrict?: boolean | 'warn'
    a11yCandidateCap?: number
    a11yIncludeHidden?: boolean
    /** @deprecated Use check `a11yStrict` instead */
    strict?: boolean | 'warn'
    /** @deprecated Use check `a11yCandidateCap` instead */
    candidateCap?: number
    /** @deprecated Use check `a11yIncludeHidden` instead */
    includeHidden?: boolean
}

/**
 * Parse accessibility selector value (JSON string) into structured form
 */
export function parseAccessibilitySelector(value: string): AccessibilitySelector {
    try {
        const parsed = JSON.parse(value)
        if (!parsed || typeof parsed !== 'object' || !parsed.name) {
            return { name: value }
        }
        return parsed as AccessibilitySelector
    } catch {
        // Fallback for simple name-only format
        return { name: value }
    }
}

/**
 * Main accessibility element lookup using in-page script execution
 *
 * Note: BiDi does not yet support accessibility locators natively.
 * We use `browser.execute` which internally uses BiDi's `script.callFunction`.
 */
export async function findAccessibilityElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: AccessibilitySelector,
    options: AccessibilityOptions = {}
): Promise<ElementReference | Error> {
    let {
        a11yStrict: strict = false,
        a11yCandidateCap: candidateCap = 1000,
        a11yIncludeHidden: includeHidden = false
    } = options

    if (options.strict !== undefined) {
        log.warn('The "strict" option is deprecated, please use "a11yStrict" instead')
        if (options.a11yStrict === undefined) { strict = options.strict }
    }
    if (options.candidateCap !== undefined) {
        log.warn('The "candidateCap" option is deprecated, please use "a11yCandidateCap" instead')
        if (options.a11yCandidateCap === undefined) { candidateCap = options.candidateCap }
    }
    if (options.includeHidden !== undefined) {
        log.warn('The "includeHidden" option is deprecated, please use "a11yIncludeHidden" instead')
        if (options.a11yIncludeHidden === undefined) { includeHidden = options.includeHidden }
    }

    const browser = 'sessionId' in this && !('elementId' in this)
        ? this as WebdriverIO.Browser
        : (this as WebdriverIO.Element).parent as WebdriverIO.Browser

    // Use in-page script execution (BiDi-compatible via script.callFunction)
    try {
        const result = await findAccessibilityElementInPage.call(
            this,
            browser,
            selector,
            { strict, candidateCap, includeHidden }
        )
        return result
    } catch (err) {
        if (err instanceof StrictSelectorError) {
            throw err
        }
        log.warn(`Accessibility lookup failed: ${err}`)
        return new Error(`Couldn't find element with accessibility selector "${JSON.stringify(selector)}"`)
    }
}

/**
 * Single-tier accessibility lookup using in-page script
 *
 * Note: Unlike standard locators (css, xpath), BiDi does not yet support
 * accessibility locators natively. We use `browser.execute` which internally
 * uses BiDi's `script.callFunction` for script execution.
 */
async function findAccessibilityElementInPage(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    browser: WebdriverIO.Browser,
    selector: AccessibilitySelector,
    options: { strict: boolean | 'warn'; candidateCap: number; includeHidden: boolean }
): Promise<ElementReference | Error> {
    const { strict, candidateCap, includeHidden } = options

    // Get the root element if this is an element scope
    const scopeElement = 'elementId' in this && (this as WebdriverIO.Element).elementId
        ? { [ELEMENT_KEY]: (this as WebdriverIO.Element).elementId }
        : null

    // Execute in-page script using browser.execute (BiDi-compatible)
    // Note: When the script returns HTMLElements, WebDriver automatically serializes them
    // to ElementReferences. We use `any` here because the types don't reflect runtime behavior.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const result = await browser.execute(
        computeAccessibilityScript as any,
        selector.name,
        selector.role || null,
        {
            strict: strict !== false,
            candidateCap,
            includeHidden,
            scopeElement: scopeElement
        } as any
    ) as any
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!result || !result.elements || result.elements.length === 0) {
        return new Error(`Couldn't find element with accessibility selector "${JSON.stringify(selector)}"`)
    }

    if (result.capHit) {
        log.warn(
            `Accessibility selector matched more than ${candidateCap} candidates. ` +
            'Consider refining the selector for better performance.'
        )
    }

    // Strict mode check
    if (strict && result.elements.length > 1) {
        const error = new StrictSelectorError(
            `a11y/${selector.name}${selector.role ? `[role=${selector.role}]` : ''}`,
            result.elements.length,
            result.descriptors.slice(0, 3)
        )
        if (strict === 'warn') {
            log.warn(error.message)
        } else {
            throw error
        }
    }

    // Return the first matched element
    // browser.execute returns HTMLElements which are auto-serialized to ElementReferences
    const element = result.elements[0]
    if (element && typeof element === 'object' && ELEMENT_KEY in element) {
        return element as ElementReference
    }

    // Fallback: wrap in proper reference format if needed
    return new Error(`Element found but could not be serialized: ${JSON.stringify(selector)}`)
}

/**
 * Find all accessibility elements (for $$ command)
 * Uses Tier 2 (in-page) only since BiDi/CDP would need different handling for multi-element
 */
export async function findAccessibilityElements(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: AccessibilitySelector,
    options: AccessibilityOptions = {}
): Promise<ElementReference[]> {
    let {
        a11yCandidateCap: candidateCap = 1000,
        a11yIncludeHidden: includeHidden = false
    } = options

    if (options.candidateCap !== undefined) {
        log.warn('The "candidateCap" option is deprecated, please use "a11yCandidateCap" instead')
        if (options.a11yCandidateCap === undefined) { candidateCap = options.candidateCap }
    }
    if (options.includeHidden !== undefined) {
        log.warn('The "includeHidden" option is deprecated, please use "a11yIncludeHidden" instead')
        if (options.a11yIncludeHidden === undefined) { includeHidden = options.includeHidden }
    }

    const browser = 'sessionId' in this && !('elementId' in this)
        ? this as WebdriverIO.Browser
        : (this as WebdriverIO.Element).parent as WebdriverIO.Browser

    // Get the root element if this is an element scope
    const scopeElement = 'elementId' in this && (this as WebdriverIO.Element).elementId
        ? { [ELEMENT_KEY]: (this as WebdriverIO.Element).elementId }
        : null

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const result = await browser.execute(
        computeAccessibilityScript as any,
        selector.name,
        selector.role || null,
        {
            strict: false, // Never strict for $$, we want all matches
            candidateCap,
            includeHidden,
            scopeElement: scopeElement
        } as any
    ) as any
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!result || !result.elements) {
        return []
    }

    if (result.capHit) {
        log.warn(
            `Accessibility selector matched more than ${candidateCap} candidates. ` +
            'Consider refining the selector for better performance.'
        )
    }

    return result.elements as ElementReference[]
}

/**
 * Parse accessibility selector string directly (without going through findStrategy)
 * This avoids the architectural issue of non-standard using='accessibility' leaking
 */
export function parseAccessibilitySelectorString(selector: string): AccessibilitySelector | null {
    const ACCESSIBILITY_PREFIX = 'a11y/'
    if (!selector.startsWith(ACCESSIBILITY_PREFIX)) {
        return null
    }

    const selectorBody = selector.slice(ACCESSIBILITY_PREFIX.length)
    const roleMatch = selectorBody.match(/^(.+?)\[role=([^\]]+)\]$/)

    if (roleMatch) {
        return { name: roleMatch[1], role: roleMatch[2] }
    }

    return { name: selectorBody }
}
