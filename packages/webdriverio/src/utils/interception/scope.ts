import { getBrowserObject } from '@wdio/utils'

import type WebDriverInterception from './index.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import { getParallelContextStore } from '../../session/context.js'
import { contextIdOf, isBrowsingContext } from '../../session/browsingContext.js'

/**
 * A mock made on a held context or in a parallel test belongs to that context,
 * any other `browser.mock()` belongs to the whole session.
 */
export function isContextScoped (scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext) {
    return isBrowsingContext(scope) || Boolean(getParallelContextStore().getStore())
}

/**
 * The mocks `mockClearAll()` and `mockRestoreAll()` act on: every mock of the session
 * for `browser`, only the mocks made for the context on a tab or in a parallel test.
 * `SESSION_MOCKS` also holds the mocks of the other instances of a multi-remote browser.
 */
export async function mocksOf (scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext): Promise<WebDriverInterception[]> {
    const browser = getBrowserObject(scope)
    const context = isContextScoped(scope) ? await contextIdOf(scope) : undefined
    return Object.values(SESSION_MOCKS)
        .flatMap((mocks) => Array.from(mocks))
        .filter((mock) => mock.isOwnedBy(browser, context))
}
