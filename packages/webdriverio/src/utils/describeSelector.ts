/**
 * Only type imports from this package: `implicitWait.ts` and `refetchElement.ts`
 * import this module and must not import the `utils/index.ts` barrel.
 */
import isPlainObject from 'is-plain-obj'
import type { CustomStrategyReference } from '../types.js'

/**
 * The selector of an element as text, for a message. A string or a function selector
 * is shown as it is. The selector of a `custom$` or `custom$$` element is the strategy
 * reference, an object: it is shown by the strategy name, as `custom$(name)`, or
 * `custom$$(name)` for an item of a list. Another object (a mobile matcher, an element
 * reference) is shown as JSON.
 */
export function describeSelector (element: { selector?: unknown, index?: number }): string {
    const { selector } = element
    if (isPlainObject(selector)) {
        const { strategyName } = selector as Partial<CustomStrategyReference>
        if (typeof strategyName === 'string') {
            return `${element.index === undefined ? 'custom$' : 'custom$$'}(${strategyName})`
        }
        try {
            return JSON.stringify(selector)
        } catch {
            /**
             * an object that is not JSON, for example with a circular reference
             */
        }
    }
    return String(selector)
}
