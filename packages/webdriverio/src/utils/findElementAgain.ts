/**
 * Only type imports from this package: this module is imported by
 * `implicitWait.ts` and `refetchElement.ts`, which must not import the
 * `utils/index.ts` barrel (see `implicitWait.ts`).
 */
import isPlainObject from 'is-plain-obj'
import { ELEMENT_KEY } from 'webdriver'
import { getWdioKind } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'
import type { CustomStrategyReference, ReactSelectorOptions, Selector } from '../types.js'

/**
 * The React selector options of an element found with `react$` or `react$$`,
 * kept so that the element is found again with the same props and state. A
 * symbol, so it isn't part of the public element type.
 */
export const REACT_OPTIONS = Symbol('wdio:reactOptions')

/**
 * Set on the "not found" element that `$$(selector)[index]` gives when the list did
 * not reach the index after `waitforTimeout`, so the implicit wait of a command does
 * not wait a second time. A symbol, so it isn't part of the public element type.
 */
export const INDEX_NOT_FOUND = Symbol('wdio:indexNotFound')

type Scope = WebdriverIO.Browser | WebdriverIO.Element
type ReactElement = WebdriverIO.Element & { [REACT_OPTIONS]?: ReactSelectorOptions }

/**
 * An element can be found again if it has a selector to run again: a string,
 * a function, a custom strategy or a mobile matcher object. An element
 * reference or an `HTMLElement` can't be.
 */
export function canFindAgain (element: WebdriverIO.Element) {
    const { selector } = element
    return typeof selector === 'string' ||
        typeof selector === 'function' ||
        (isPlainObject(selector) && typeof (selector as ElementReference)[ELEMENT_KEY] !== 'string')
}

/**
 * `element.custom$` and `element.custom$$` give their element to the strategy
 * as its last argument. Give the parent the element is found in now instead:
 * the parent of the first query can be stale.
 */
function selectorIn (element: WebdriverIO.Element, parent: Scope): Selector {
    const selector = element.selector as CustomStrategyReference
    if (!isPlainObject(selector) || typeof selector.strategy !== 'function' || getWdioKind(element.parent) !== 'element') {
        return element.selector
    }
    return { ...selector, strategyArguments: [...selector.strategyArguments.slice(0, -1), parent] }
}

/**
 * The list commands whose items can be found again, with the flags that their
 * items get. `findAllAgain` below goes the other way, from the flags to the
 * command. A `custom$$` list and a multi-remote list are not in it.
 */
const LIST_QUERIES = new Map<string, { isShadowElement: boolean, isReactElement: boolean }>([
    ['$$', { isShadowElement: false, isReactElement: false }],
    ['shadow$$', { isShadowElement: true, isReactElement: false }],
    ['react$$', { isShadowElement: false, isReactElement: true }]
])

/**
 * The props of an item of a list that `foundWith` found, for `getElements`.
 * `props` are the arguments of that command after the selector. `undefined` for
 * a list command that is not in `LIST_QUERIES`.
 */
export function itemPropsOf (foundWith: string, props: unknown[]) {
    const flags = LIST_QUERIES.get(foundWith)
    if (!flags) {
        return undefined
    }
    return {
        ...flags,
        ...(flags.isReactElement && props[0] ? { reactOptions: props[0] as ReactSelectorOptions } : {})
    }
}

/**
 * Find all elements again with the list form of the command that found this
 * element: `react$$`, `shadow$$` or `$$`.
 */
export function findAllAgain (element: WebdriverIO.Element, parent = element.parent as Scope) {
    if (element.isReactElement) {
        return parent.react$$(element.selector as string, (element as ReactElement)[REACT_OPTIONS])
    }
    if (element.isShadowElement) {
        return (parent as WebdriverIO.Element).shadow$$(element.selector as string)
    }
    return parent.$$(selectorIn(element, parent) as string)
}

/**
 * Find an element again the way it was found: with the same command (`$`,
 * `shadow$` or `react$`, or the list form of it for an element of a list), at
 * the same index and with the same strictness.
 *
 * With `wait`, an element of a list waits until its index exists, as
 * `$$(selector)[index]` does. Without it, a missing index gives `undefined`
 * at once. A single element without a match comes back without an element id.
 */
export async function findElementAgain (
    element: WebdriverIO.Element,
    { parent = element.parent as Scope, wait = false }: { parent?: Scope, wait?: boolean } = {}
): Promise<WebdriverIO.Element | undefined> {
    if (element.index !== undefined) {
        if (wait) {
            const item = await findAllAgain(element, parent)[element.index]?.getElement()
            /**
             * the wait of an index gives a "not found" item when the list never reaches the
             * index (#12576). A lookup that waits rejects then with its error, as before, so
             * `waitForExist`, the implicit wait and the refetch of a stale item don't change
             */
            if (item && !item.elementId && item.error) {
                throw item.error
            }
            return item
        }

        /**
         * a resolved list also waits for an index past its end, so check the
         * length before reading the index
         */
        const elements = await findAllAgain(element, parent)
        return element.index < elements.length ? elements[element.index] : undefined
    }

    if (element.isReactElement) {
        return parent.react$(element.selector as string, (element as ReactElement)[REACT_OPTIONS]).getElement()
    }
    if (element.isShadowElement) {
        return (parent as WebdriverIO.Element).shadow$(element.selector as string).getElement()
    }
    return parent.$(selectorIn(element, parent), { strict: element.strict }).getElement()
}
