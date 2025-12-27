/**
 * Accessibility Locator for computed accessibility selectors
 *
 * Strategy:
 * - Tier 1 (BiDi): Uses browsingContext.locateNodes with accessibility locator (preferred)
 * - Tier 2 (In-Page): Falls back to injected script with candidate generation + verification
 *
 * Strictness:
 * - Default: false (returns first match, like document.querySelector)
 * - 'warn': Logs warning if multiple matches, returns first
 * - true: Throws StrictSelectorError if multiple matches (aligns with Playwright/Cypress)
 *
 * Note: In v10, the default will flip to `true` for stricter element selection.
 */
import logger from '@wdio/logger'
import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { StrictSelectorError } from '../errors/StrictSelectorError.js'
import computeAccessibilityScript from '../scripts/computeAccessibility.js'
import { getContextManager } from '../session/context.js'

const log = logger('webdriverio')

export interface AccessibilitySelector {
    name: string
    role?: string
}

export interface AccessibilityOptions {
    strict?: boolean | 'warn'
    candidateCap?: number
    includeHidden?: boolean
}

/**
 * Parse accessibility selector value (JSON string) into structured form
 */
export function parseAccessibilitySelector(value: string): AccessibilitySelector {
    try {
        return JSON.parse(value) as AccessibilitySelector
    } catch {
        // Fallback for simple name-only format
        return { name: value }
    }
}

/**
 * Main accessibility element lookup with three-tier fallback
 */
export async function findAccessibilityElement(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: AccessibilitySelector,
    options: AccessibilityOptions = {}
): Promise<ElementReference | Error> {
    const {
        strict = false,
        candidateCap = 1000,
        includeHidden = false
    } = options

    const browser = 'sessionId' in this && !('elementId' in this)
        ? this as WebdriverIO.Browser
        : (this as WebdriverIO.Element).parent as WebdriverIO.Browser

    // Tier 1: Try BiDi if available
    if (browser.isBidi) {
        try {
            const result = await findAccessibilityElementBidi.call(this, browser, selector, strict)
            if (result) {
                return result
            }
        } catch (err) {
            log.debug(`Tier 1 (BiDi) failed: ${err}, falling back to Tier 2/3`)
        }
    }

    // Tier 2: In-page fallback (when BiDi is not available or fails)
    try {
        const result = await findAccessibilityElementInPage.call(
            this,
            browser,
            selector,
            { strict, candidateCap, includeHidden }
        )
        return result
    } catch (err) {
        log.warn(`Tier 3 (In-Page) failed: ${err}`)
        return new Error(`Couldn't find element with accessibility selector "${JSON.stringify(selector)}"`)
    }
}

/**
 * Tier 1: BiDi-based accessibility lookup
 */
async function findAccessibilityElementBidi(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    browser: WebdriverIO.Browser,
    selector: AccessibilitySelector,
    strict: boolean | 'warn'
): Promise<ElementReference | null> {
    // Get the current browsing context using context manager (not window handle)
    const contextManager = getContextManager(browser)
    const context = await contextManager.getCurrentContext()

    try {
        // Attempt to use accessibility locator with maxNodeCount: 2 for strict mode
        const locator = {
            type: 'accessibility' as const,
            value: selector
        }

        const result = await browser.browsingContextLocateNodes({
            context,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            locator: locator as any, // Type assertion needed as accessibility may not be in types yet
            maxNodeCount: strict ? 2 : 1
        })

        if (!result.nodes || result.nodes.length === 0) {
            return null
        }

        // Strict mode check
        if (strict && result.nodes.length > 1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const descriptors = result.nodes.slice(0, 3).map((n: any) =>
                n.value?.attributes?.id || n.value?.localName || 'element'
            )
            const error = new StrictSelectorError(
                `accessibility/${selector.name}${selector.role ? `[role=${selector.role}]` : ''}`,
                result.nodes.length,
                descriptors
            )
            if (strict === 'warn') {
                log.warn(error.message)
            } else {
                throw error
            }
        }

        const node = result.nodes[0]
        if (node.sharedId) {
            return { [ELEMENT_KEY]: node.sharedId }
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        // If accessibility locator is not supported, this will fail
        if (err instanceof StrictSelectorError) {
            throw err
        }
        log.debug(`BiDi accessibility locator not supported: ${err.message}`)
    }

    return null
}

/**
 * Tier 3: In-page accessibility lookup using injected script
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

    // Execute in-page script
    // Note: When the script returns HTMLElements, WebDriver automatically serializes them
    // to ElementReferences. We use `any` here because the types don't match the runtime behavior.
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
            `accessibility/${selector.name}${selector.role ? `[role=${selector.role}]` : ''}`,
            result.elements.length,
            result.descriptors || []
        )
        if (strict === 'warn') {
            log.warn(error.message)
        } else {
            throw error
        }
    }

    // WebDriver serializes HTMLElements to ElementReferences automatically
    return result.elements[0] as ElementReference
}

/**
 * Find all accessibility elements (for $$ command)
 * Uses Tier 3 (in-page) only since BiDi/CDP would need different handling for multi-element
 */
export async function findAccessibilityElements(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: AccessibilitySelector,
    options: AccessibilityOptions = {}
): Promise<ElementReference[]> {
    const {
        candidateCap = 1000,
        includeHidden = false
    } = options

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
    const ACCESSIBILITY_PREFIX = 'accessibility/'
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
