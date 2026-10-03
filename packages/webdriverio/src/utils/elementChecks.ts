import { ELEMENT_KEY } from 'webdriver'
import logger from '@wdio/logger'

import elementContains from '../scripts/elementContains.js'
import elementsContainedIn from '../scripts/elementsContainedIn.js'
import elementsConnected from '../scripts/elementsConnected.js'
import { executeInContext } from './bidi/index.js'

const log = logger('webdriverio')

/**
 * The checks only hold element ids. In a BiDi session they run in the
 * context those elements were found in, which is not always the session's
 * current one (a held frame or tab).
 */
function run (browser: WebdriverIO.Browser, contextId?: string) {
    return <ReturnValue>(script: Function, ...args: unknown[]): Promise<ReturnValue> => (
        contextId && browser.isBidi
            ? executeInContext<ReturnValue>(browser, contextId, script, ...args)
            : browser.execute(script as never, ...(args as never[])) as Promise<ReturnValue>
    )
}

/**
 * Run a boolean check for each of `elementIds` in a single batched round trip; if the
 * batch itself fails outright (e.g. one reference is stale and poisons argument
 * deserialization), fall back to checking each element individually so one bad
 * reference doesn't hide every other result. Either way, a failure is logged instead
 * of being silently swallowed, and a per-element failure resolves to `false`.
 *
 * Note: the browser-side scripts must stay separate, self-contained functions because
 * `browser.execute()` serializes only the passed function's own source text — only
 * this Node-side orchestration is shared between the different check types.
 */
async function runBatchedElementCheck (
    elementIds: string[],
    checkName: string,
    contextId: string | undefined,
    onElementCheckError: ((elementId: string) => void) | undefined,
    batchCheck: () => Promise<boolean[]>,
    perElementCheck: (elementId: string) => Promise<boolean>
): Promise<boolean[]> {
    if (elementIds.length === 0) {
        return []
    }

    const inContext = contextId ? ` in context ${contextId}` : ''
    try {
        const result = await batchCheck()
        /**
         * guard against a driver returning a malformed batch result: downstream
         * callers filter by index, so a short array would silently treat the
         * missing tail as `false` and drop valid elements
         */
        if (!Array.isArray(result) || result.length !== elementIds.length) {
            throw new Error(`expected ${elementIds.length} result(s) but got ${Array.isArray(result) ? result.length : typeof result}`)
        }
        return result
    } catch (err) {
        log.warn(`Failed to batch-check element ${checkName}${inContext}: ${(err as Error).message}. Falling back to per-element checks.`)
    }

    return Promise.all(elementIds.map(async (elementId) => {
        try {
            return await perElementCheck(elementId)
        } catch (err) {
            /**
             * this specific element is likely stale/detached; log so it's visible but
             * don't fail the whole lookup for it
             */
            log.warn(`Failed to check element ${checkName} for element ${elementId}${inContext}: ${(err as Error).message}`)
            onElementCheckError?.(elementId)
            return false
        }
    }))
}

/**
 * Check, for each of `elementIds`, whether it's a real DOM descendant of `scope`
 * (crossing shadow boundaries via `.host`), in a single round trip with per-element
 * fallback.
 */
export async function checkElementsContainedIn (
    browser: WebdriverIO.Browser,
    scope: string,
    elementIds: string[],
    contextId?: string,
    onElementCheckError?: (elementId: string) => void
): Promise<boolean[]> {
    return runBatchedElementCheck(
        elementIds,
        `containment for scope ${scope}`,
        contextId,
        onElementCheckError,
        () => run(browser, contextId)(
            elementsContainedIn,
            { [ELEMENT_KEY]: scope } as unknown as HTMLElement,
            elementIds.map((elementId) => ({ [ELEMENT_KEY]: elementId })) as unknown as HTMLElement[]
        ),
        (elementId) => run(browser, contextId)(
            elementContains,
            { [ELEMENT_KEY]: scope } as unknown as HTMLElement,
            { [ELEMENT_KEY]: elementId } as unknown as HTMLElement
        )
    )
}

/**
 * Check, for each of `elementIds`, whether it's still connected to the live DOM,
 * in a single round trip with per-element fallback. Stale references that can't be
 * resolved at all count as not connected.
 */
export async function checkElementsConnected (
    browser: WebdriverIO.Browser,
    elementIds: string[],
    contextId?: string,
    onElementCheckError?: (elementId: string) => void
): Promise<boolean[]> {
    return runBatchedElementCheck(
        elementIds,
        'connectivity',
        contextId,
        onElementCheckError,
        () => run(browser, contextId)(
            elementsConnected,
            elementIds.map((elementId) => ({ [ELEMENT_KEY]: elementId })) as unknown as HTMLElement[]
        ),
        (elementId) => run(browser, contextId)(
            (el: Element) => el.isConnected,
            { [ELEMENT_KEY]: elementId } as unknown as HTMLElement
        )
    )
}
