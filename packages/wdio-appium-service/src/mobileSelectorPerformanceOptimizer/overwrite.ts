import type { OptimizationOptions } from './types.js'
import { isXPathSelector, isNativeContext, SINGLE_ELEMENT_COMMANDS, MULTIPLE_ELEMENT_COMMANDS } from './utils/index.js'
import { optimizeSingleSelector, optimizeMultipleSelectors } from './optimizer.js'

/**
 * Overwrites all user commands to replace XPath selectors with optimized alternatives
 */
export function overwriteUserCommands(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    options: OptimizationOptions
): void {
    if (!('overwriteCommand' in browser && typeof browser.overwriteCommand === 'function')) {
        return
    }

    const browserWithOverwrite = browser as WebdriverIO.Browser & {
        overwriteCommand: (name: string, func: Function) => void
    }

    // Overwrite single element commands: $ and custom$
    for (const commandName of SINGLE_ELEMENT_COMMANDS) {
        browserWithOverwrite.overwriteCommand(commandName, async (
            originalFunc: (selector: unknown) => Promise<WebdriverIO.Element>,
            selector: unknown
        ) => {
            // Skip if already replacing, not in native context, or not an XPath selector
            if (options.isReplacingSelector.value || !isNativeContext(browser) || !isXPathSelector(selector)) {
                return originalFunc.call(browser, selector)
            }

            return optimizeSingleSelector(commandName, selector, originalFunc, browser, options)
        })
    }

    // Overwrite multiple element commands: $$ and custom$$
    for (const commandName of MULTIPLE_ELEMENT_COMMANDS) {
        browserWithOverwrite.overwriteCommand(commandName, async (
            originalFunc: (selector: unknown) => Promise<WebdriverIO.Element[]>,
            selector: unknown
        ) => {
            // Skip if already replacing, not in native context, or not an XPath selector
            if (options.isReplacingSelector.value || !isNativeContext(browser) || !isXPathSelector(selector)) {
                return originalFunc.call(browser, selector)
            }

            return optimizeMultipleSelectors(commandName, selector, originalFunc, browser, options)
        })
    }
}

