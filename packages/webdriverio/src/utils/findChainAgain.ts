import { getWdioKind } from '@wdio/utils'

import { canFindAgain, findElementAgain } from './findElementAgain.js'

/**
 * Find the chain again from the browser, once, without a wait: a stale parent waits for itself,
 * and in BiDi finds its removed child. Keeps an element reference. `undefined` when one is gone.
 * Not `refetchElement`: it waits for each element (`implicitWait`).
 */
export async function findChainAgain (element: WebdriverIO.Element): Promise<WebdriverIO.Element | undefined> {
    const chain: WebdriverIO.Element[] = []
    for (let current = element; getWdioKind(current) === 'element'; current = current.parent as WebdriverIO.Element) {
        chain.unshift(current)
    }
    let parent = chain[0]?.parent as WebdriverIO.Browser | WebdriverIO.Element
    for (const item of chain) {
        const found = canFindAgain(item) ? await findElementAgain(item, { parent }) : item
        if (!found?.elementId) {
            return undefined
        }
        parent = found
    }
    return parent as WebdriverIO.Element
}
