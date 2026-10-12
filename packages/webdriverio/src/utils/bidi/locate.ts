import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { getParallelContextStore } from '../../session/context.js'

/**
 * Classic element endpoints (find from element, shadow root, execute script)
 * target the session's top-level window. A parallel test runs in its own tab,
 * so while its context store is active they must be replaced by BiDi commands.
 */
export function isParallelContextActive(): boolean {
    return Boolean(getParallelContextStore().getStore())
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
    const result = await browser.browsingContextLocateNodes({
        locator: { type: 'xpath', value: expression },
        context,
        startNodes: [{ sharedId: elementId }]
    })
    return result.nodes
        .filter((node) => Boolean(node.sharedId))
        .map((node) => ({ [ELEMENT_KEY]: node.sharedId as string }))
}
