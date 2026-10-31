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
    return allMocks().filter((mock) => mock.isOwnedBy(browser, filter))
}

/**
 * Every mock of the session of a browser, whatever tab or parallel test made it.
 */
export function sessionMocksOf (browser: WebdriverIO.Browser): WebDriverInterception[] {
    return allMocks().filter((mock) => mock.isOwnedBy(browser))
}

function allMocks (): WebDriverInterception[] {
    return Object.values(SESSION_MOCKS).flatMap((mocks) => Array.from(mocks))
}

/**
 * Restores the given mocks. A mock that can't be restored does not keep the others
 * from it; its error is thrown afterwards, all of them when several fail.
 */
export async function restoreMocks (mocks: WebDriverInterception[]): Promise<void> {
    const errors: unknown[] = []
    for (const mock of mocks) {
        try {
            await mock.restore()
        } catch (err) {
            errors.push(err)
        }
    }
    if (errors.length === 1) {
        throw errors[0]
    }
    if (errors.length > 1) {
        throw new AggregateError(errors, `${errors.length} of ${mocks.length} mocks could not be restored: ${errors.map((err) => err instanceof Error ? err.message : String(err)).join(', ')}`)
    }
}
