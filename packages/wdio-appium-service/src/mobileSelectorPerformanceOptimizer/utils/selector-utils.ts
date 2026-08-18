/**
 * Checks if a command is an element find command ($, $$, custom$, etc.).
 * These commands return elements and should NOT be tracked as element actions.
 * Based on WebdriverIO source: packages/webdriverio/src/commands/element/
 * - $, $$, custom$, custom$$, shadow$, shadow$$ are marked as @type utility
 * - getElement, getElements, nextElement, previousElement, parentElement are also @type utility
 */
export function isElementFindCommand(commandName: string): boolean {
    const elementFindCommands = [
        '$', '$$', 'findElement', 'findElements',
        'custom$', 'custom$$',
        'shadow$', 'shadow$$',
        'getElement', 'getElements',
        'nextElement', 'previousElement', 'parentElement',
    ]
    return elementFindCommands.includes(commandName)
}

/**
 * Extracts a selector string from command arguments.
 */
export function extractSelectorFromArgs(args: unknown[]): string | null {
    if (!args || args.length === 0) {
        return null
    }

    const firstArg = args[0]

    if (typeof firstArg === 'string') {
        return firstArg
    }

    if (typeof firstArg === 'object' && firstArg !== null) {
        try {
            return JSON.stringify(firstArg)
        } catch {
            return String(firstArg)
        }
    }

    return String(firstArg)
}

/**
 * Checks if a selector is an XPath selector.
 * Uses pattern matching to distinguish XPath from CSS selectors.
 *
 * XPath patterns detected:
 * - Absolute path: /html, //div, //*
 * - Relative path: ./div, ../parent
 * - Descendant any: asterisk followed by slash, e.g. asterisk/child
 * - Grouped expressions: (//div)[1] - must contain XPath-like content
 *
 * Not XPath (CSS selectors):
 * - Pseudo-selectors starting with (: e.g., (:has(...))
 * - Class selectors: .class
 * - ID selectors: #id
 * - Tag selectors: div, button
 */
export function isXPathSelector(selector: unknown): selector is string {
    if (typeof selector !== 'string') {
        return false
    }

    if (selector.startsWith('/') ||
        selector.startsWith('../') ||
        selector.startsWith('./') ||
        selector.startsWith('*/')) {
        return true
    }

    if (selector.startsWith('(')) {
        if (selector.startsWith('(:')) {
            return false
        }
        return selector.includes('/') || selector.includes('@')
    }

    return false
}

/**
 * Parses an optimized selector string into WebDriver using/value format.
 */
export function parseOptimizedSelector(optimizedSelector: string): { using: string, value: string } | null {
    if (optimizedSelector.startsWith('~')) {
        return {
            using: 'accessibility id',
            value: optimizedSelector.substring(1)
        }
    }
    if (optimizedSelector.startsWith('-ios predicate string:')) {
        return {
            using: '-ios predicate string',
            value: optimizedSelector.substring('-ios predicate string:'.length)
        }
    }
    if (optimizedSelector.startsWith('-ios class chain:')) {
        return {
            using: '-ios class chain',
            value: optimizedSelector.substring('-ios class chain:'.length)
        }
    }
    return null
}
