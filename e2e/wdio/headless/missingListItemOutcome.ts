/**
 * Helpers of the "missing list item" baseline specs: each check gives a short label, so a
 * spec compares a whole row of checks with one `toEqual` and a failure shows the cells
 * that changed.
 */

/**
 * An item of a list as a spec gets it: an element, a chainable element or `undefined`.
 * It is kept in an array by the entries, so an `async` entry does not resolve the chain.
 */
export type Item = WebdriverIO.Element

/**
 * the label of what a check gives:
 * - the value as JSON (`false`, `true`, `"text"`), or `ok` for `undefined` (a passing matcher, a click)
 * - `assertion fails` for a matcher that fails
 * - a short name of the error for a check that throws
 */
export async function outcome (check: () => Promise<unknown>): Promise<string> {
    try {
        const value = await check()
        return value === undefined ? 'ok' : JSON.stringify(value)
    } catch (err) {
        const error = err as Error & { matcherResult?: unknown }
        if (error.matcherResult) {
            return 'assertion fails'
        }
        const message = String(error?.message ?? error)
        if (message.includes('Index out of bounds!')) {
            return 'Index out of bounds'
        }
        const notFound = message.match(/Can't call (\S+) on element with selector "([^"]*)" because element wasn't found/)
        if (notFound) {
            return `can't call ${notFound[1]} on ${notFound[2]}`
        }
        if (message.includes('Element could not be found')) {
            return 'Element could not be found'
        }
        if (message.includes('Multi-remote object has no instance named')) {
            return `no instance ${message.match(/named "([^"]+)"/)?.[1]}`
        }
        if (message.includes('selector needs to be typeof')) {
            return 'selector needs to be typeof string or function'
        }
        if (error instanceof TypeError && message.includes('Cannot read properties of undefined')) {
            return 'the item is undefined'
        }
        return `throws: ${message.split('\n')[0]}`
    }
}

/**
 * runs every check on a new item from `entry`: a check can change the item object
 * (for example a found element id), so no check sees the item of another check
 */
export async function row<Checks extends Record<string, (item: Item) => Promise<unknown>>> (
    entry: () => Promise<[Item]> | [Item],
    checks: Checks
): Promise<Record<keyof Checks, string>> {
    const result = {} as Record<keyof Checks, string>
    for (const [name, check] of Object.entries(checks)) {
        result[name as keyof Checks] = await outcome(async () => {
            const [item] = await entry()
            return check(item)
        })
    }
    return result
}
