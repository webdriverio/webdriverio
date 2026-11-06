import { ELEMENT_KEY, type remote } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'
import { CHROMIUM_CONTEXT_SWAP_MARKERS } from '@wdio/utils'

import { getParallelContextStore } from '../../session/context.js'

/**
 * Classic element endpoints (find from element, shadow root, execute script)
 * target the session's top-level window. A parallel test runs in its own tab,
 * so while its context store is active they must be replaced by BiDi commands.
 */
export function isParallelContextActive(): boolean {
    return Boolean(getParallelContextStore().getStore())
}

export async function locateNodesAcrossSwap(
    browser: WebdriverIO.Browser,
    params: remote.BrowsingContextLocateNodesParameters
): ReturnType<WebdriverIO.Browser['browsingContextLocateNodes']> {
    try {
        return await browser.browsingContextLocateNodes(params)
    } catch (err) {
        const message = String((err as Error)?.message ?? err)
        if (!CHROMIUM_CONTEXT_SWAP_MARKERS.some((marker) => message.includes(marker))) {
            throw err
        }
        // "Cannot find context" only returns once the new document commits, so the retry lands there
        return browser.browsingContextLocateNodes(params)
    }
}

/**
 * Relative XPath (`./x`, `../x`) evaluated from `elementId` in `context`.
 */
export async function locateRelativeXPath(
    browser: WebdriverIO.Browser,
    context: string,
    elementId: string,
    expression: string
): Promise<ElementReference[]> {
    const result = await locateNodesAcrossSwap(browser, {
        locator: { type: 'xpath', value: expression },
        context,
        startNodes: [{ sharedId: elementId }]
    })
    return result.nodes
        .filter((node) => Boolean(node.sharedId))
        .map((node) => ({ [ELEMENT_KEY]: node.sharedId as string }))
}
