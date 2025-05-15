import type { ReactSelectorOptions } from '../../types.js'

export async function react$(
    this: WebdriverIO.BrowsingContext,
    _: string,
    __: ReactSelectorOptions = {}
): Promise<WebdriverIO.Element> {
    /**
     * `react$` command is not supported for `WebdriverIO.BrowsingContext` as we currently don't know whether
     * we want to continue to support the feature in general. This is only here so we avoid larger type errors.
     */
    throw new Error('Not implemented for `WebdriverIO.BrowsingContext`')
}