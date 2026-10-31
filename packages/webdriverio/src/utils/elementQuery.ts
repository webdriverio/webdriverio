import { WDIO_QUERY, queryCall, queryPrefix } from '@wdio/utils'
import isPlainObject from 'is-plain-obj'

import { REACT_OPTIONS } from './findElementAgain.js'
import type { CustomStrategyReference, ReactSelectorOptions, Selector } from '../types.js'

// a `$()` with one of these functions is that command
const FUNCTION_QUERIES = ['nextElement', 'previousElement', 'parentElement']

interface QueriedElement {
    selector?: Selector
    parent?: unknown
    index?: number
    isReactElement?: boolean
    isShadowElement?: boolean
    [REACT_OPTIONS]?: ReactSelectorOptions
}

/**
 * The query of an element as in the test code, for example `` $(`#form`).shadow$(`#name`) ``
 * or `` $$(`li`)[2] ``, see `WDIO_QUERY` in `@wdio/utils`
 */
export function elementQuery (element: QueriedElement): string {
    const { selector, index } = element
    const prefix = queryPrefix(element.parent)
    const item = index === undefined ? '' : `[${index}]`
    if (typeof selector === 'function') {
        const tagged = (selector as { [WDIO_QUERY]?: unknown })[WDIO_QUERY]
        if (typeof tagged === 'string') {
            return `${prefix}${tagged}${item}`
        }
        if (index === undefined && FUNCTION_QUERIES.includes(selector.name)) {
            return `${prefix}${selector.name}()`
        }
    }
    const custom = isPlainObject(selector) && typeof (selector as Partial<CustomStrategyReference>).strategyName === 'string'
        ? selector as CustomStrategyReference
        : undefined
    const command = custom ? 'custom$' : element.isReactElement ? 'react$' : element.isShadowElement ? 'shadow$' : '$'
    const args = custom
        ? [custom.strategyName, ...(custom.strategyArguments ?? [])]
        : [selector, ...reactArguments(element[REACT_OPTIONS])]
    return `${prefix}${queryCall(index === undefined ? command : `${command}$`, args)}${item}`
}

/**
 * The query of an element list, for example `` $(`ul`).$$(`li`) ``
 */
export function listQuery (list: { parent?: unknown, foundWith?: string, selector?: unknown, props?: unknown[] }): string {
    const tagged = typeof list.selector === 'function' ? (list.selector as { [WDIO_QUERY]?: unknown })[WDIO_QUERY] : undefined
    return `${queryPrefix(list.parent)}${typeof tagged === 'string' ? tagged : queryCall(list.foundWith ?? '$$', [list.selector, ...(list.props ?? [])])}`
}

/**
 * Marks the function of a query that runs as a script (the `shadow$` fallback), so that
 * its element shows that query and not a function
 */
export function tagQuery<T extends Function> (fn: T, command: string, args: unknown[]): T {
    return Object.defineProperty(fn, WDIO_QUERY, { value: queryCall(command, args) })
}

function reactArguments (options?: ReactSelectorOptions) {
    const { props, state } = options ?? {}
    const hasProps = props !== undefined && !(isPlainObject(props) && Object.keys(props).length === 0)
    const hasState = state !== undefined && !(isPlainObject(state) && Object.keys(state).length === 0)
    if (!hasProps && !hasState) {
        return []
    }
    return [{ ...(hasProps ? { props } : {}), ...(hasState ? { state } : {}) }]
}
