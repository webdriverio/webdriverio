/**
 * Only type imports: this module is imported by `implicitWait.ts` and
 * `refetchElement.ts`, which must not import the `utils/index.ts` barrel
 * (see `implicitWait.ts`).
 */
import type { CustomStrategyReference, ReactSelectorOptions } from '../types.js'

/**
 * The React selector options of an element found with `react$` or `react$$`,
 * kept so that the element is found again with the same props and state. A
 * symbol, so it isn't part of the public element type.
 */
export const REACT_OPTIONS = Symbol('wdio:reactOptions')

type Scope = WebdriverIO.Browser | WebdriverIO.Element
type ReactElement = WebdriverIO.Element & { [REACT_OPTIONS]?: ReactSelectorOptions }

/**
 * An element can be found again if it has a selector to run again: a string,
 * a function or a custom strategy. An element reference or an `HTMLElement`
 * can't be.
 */
export function canFindAgain (element: WebdriverIO.Element) {
    const { selector } = element
    return typeof selector === 'string' ||
        typeof selector === 'function' ||
        typeof (selector as CustomStrategyReference | undefined)?.strategy === 'function'
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
    return parent.$$(element.selector as string)
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
            return findAllAgain(element, parent)[element.index]?.getElement()
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
    return parent.$(element.selector, { strict: element.strict }).getElement()
}
