import type { OptimizationOptions } from './types.js'
import { isXPathSelector } from './utils.js'
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
    for (const commandName of ['$', 'custom$']) {
        browserWithOverwrite.overwriteCommand(commandName, async (
            originalFunc: (selector: unknown) => Promise<WebdriverIO.Element>,
            selector: unknown
        ) => {
            // Skip if we're already in the process of replacing (to avoid recursion)
            if (options.isReplacingSelector.value) {
                return originalFunc.call(browser, selector)
            }

            // Only process string selectors that are XPath
            if (!isXPathSelector(selector)) {
                return originalFunc.call(browser, selector)
            }

            return optimizeSingleSelector(commandName, selector, originalFunc, browser, options)
        })
    }

    // Overwrite multiple element commands: $$ and custom$$
    for (const commandName of ['$$', 'custom$$']) {
        browserWithOverwrite.overwriteCommand(commandName, async (
            originalFunc: (selector: unknown) => Promise<WebdriverIO.Element[]>,
            selector: unknown
        ) => {
            // Skip if we're already in the process of replacing (to avoid recursion)
            if (options.isReplacingSelector.value) {
                return originalFunc.call(browser, selector)
            }

            // Only process string selectors that are XPath
            if (!isXPathSelector(selector)) {
                return originalFunc.call(browser, selector)
            }

            return optimizeMultipleSelectors(commandName, selector, originalFunc, browser, options)
        })
    }
}

