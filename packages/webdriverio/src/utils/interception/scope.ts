import { getBrowserObject } from '@wdio/utils'

import type WebDriverInterception from './index.js'
import { SESSION_MOCKS } from '../../commands/browser/mock.js'
import { getParallelContextStore } from '../../session/context.js'
import { isBrowsingContext } from '../../session/browsingContext.js'

/**
 * The mocks `mockClearAll()` and `mockRestoreAll()` act on: on a tab, the mocks made
 * for that tab; in a parallel test, the mocks that test created, also on tabs it opened;
 * otherwise every mock of the session. `SESSION_MOCKS` also holds the mocks of the other
 * instances of a multi-remote browser.
 */
export function mocksOf (scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext): WebDriverInterception[] {
    const browser = getBrowserObject(scope)
    const filter = isBrowsingContext(scope)
        ? { context: scope.contextId }
        : { test: getParallelContextStore().getStore() }
    return Object.values(SESSION_MOCKS)
        .flatMap((mocks) => Array.from(mocks))
        .filter((mock) => mock.isOwnedBy(browser, filter))
}
