import { asyncIterators, chainElementPromise, ELEMENT_ARRAY_WRAP, getBrowserObject, registerElementArrayFactory, WDIO_KIND } from '@wdio/utils'
import type { ElementReference } from '@wdio/protocols'
import type { Selector } from '../types.js'

/**
 * A plain element or a multi-remote element. Both travel in the same list
 * implementation; the public type (`ElementArray` or `MultiRemoteElementArray`)
 * is chosen by the command that created it.
 */
type ElementList = Array<WebdriverIO.Element | WebdriverIO.MultiRemoteElement>

/**
 * Metadata carried by every element list returned from `$$`, `custom$$`,
 * `react$$` and `shadow$$`. Callers may mutate `parent` while the list is
 * still loading (the fetch sometimes discovers a more accurate parent).
 */
interface ElementArrayMetadata {
    /**
     * A list of elements (`$$([elemA, elemB])`) is normalized to one selector
     * when every element shares it, otherwise the list has no selector.
     */
    selector?: Selector | WebdriverIO.Element[] | ElementReference[] | HTMLElement[]
    foundWith: string
    parent?: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement
    props: unknown[]
    isMultiRemote?: boolean
    /**
     * Original queries refetch an out-of-range index. Derived lists (a `slice`
     * or a `filter`) must not: their bounds are not the query's bounds.
     */
    refetch?: boolean
}

interface ElementArrayState {
    metadata: ElementArrayMetadata
    resolved: boolean
    loader?: () => Promise<ElementList>
    loading?: Promise<ElementList>
    wrappers: Array<(load: () => Promise<ElementList>) => Promise<ElementList>>
    /**
     * The proxy handed to user code. Methods return this so identity and
     * metadata survive operations that would otherwise reveal the raw array.
     */
    self?: WebdriverIO.ElementArray
}

const states = new WeakMap<object, ElementArrayState>()

const RETURN_SELF = new Set(['reverse', 'sort', 'fill', 'copyWithin'])

function stateOf (array: object): ElementArrayState {
    const state = states.get(array)
    if (!state) {
        throw new Error('Expected a WebdriverIO element array')
    }
    return state
}

function normalizeSelector (selector: ElementArrayMetadata['selector']): Selector | undefined {
    if (typeof selector === 'undefined') {
        return undefined
    }
    if (!Array.isArray(selector)) {
        return selector as Selector
    }

    /**
     * `$$([elemA, elemB])` has no single selector unless every element was
     * found with the same one.
     */
    const elements = selector as WebdriverIO.Element[]
    if (
        elements.length > 0 &&
        elements.every((element) => element && element.selector && element.selector === elements[0].selector)
    ) {
        return elements[0].selector
    }
    return undefined
}

function prepareMetadata (metadata: ElementArrayMetadata): ElementArrayMetadata {
    metadata.selector = normalizeSelector(metadata.selector)
    metadata.props = metadata.props ?? []
    metadata.foundWith = metadata.foundWith || '$$'
    return metadata
}

function cloneMetadata (metadata: ElementArrayMetadata): ElementArrayMetadata {
    return {
        ...metadata,
        props: [...metadata.props]
    }
}

/**
 * A derived list is not the query itself. Dropping refetch keeps an index past
 * that list from running the original query: `$$('li').slice(0, 2)[3]` must
 * not become the fourth match, and a filtered list must not return an element
 * the filter excluded.
 */
function derivedMetadata (metadata: ElementArrayMetadata): ElementArrayMetadata {
    return {
        ...cloneMetadata(metadata),
        refetch: false
    }
}

function fill (array: ElementList, items: ElementList) {
    const state = stateOf(array)
    array.splice(0, array.length, ...items)
    state.resolved = true
}

async function load (array: ElementList): Promise<ElementList> {
    const state = stateOf(array)
    if (state.resolved) {
        return array
    }
    if (!state.loading) {
        const base = async () => {
            const items = state.loader ? await state.loader() : []
            fill(array, items)
            return items
        }
        let run: () => Promise<ElementList> = base
        for (const wrapper of state.wrappers) {
            const inner = run
            run = () => wrapper(inner)
        }
        state.loading = run().then((items) => {
            if (!state.resolved) {
                fill(array, items)
            }
            return array
        })
    }
    await state.loading
    return array
}

function listForIteration (array: ElementList): ElementList {
    return (stateOf(array).self ?? array) as unknown as ElementList
}

/**
 * Same conversion as `Array.prototype.at`: truncate toward zero, and treat NaN as 0.
 */
function integerIndex (index: number) {
    const truncated = Math.trunc(index)
    return Number.isNaN(truncated) ? 0 : truncated
}

/**
 * An in-range index of a resolved list is that element. An index past the end
 * of an original query still waits and refetches, which is what `$$('li')[5]`
 * does before the list resolves. A slice, a filter, and a negative index do not refetch.
 */
function readIndex (array: ElementList, index: number) {
    const normalized = integerIndex(index)
    const state = stateOf(array)
    const multiRemote = state.metadata.isMultiRemote === true
    if (!state.resolved) {
        return chainElementPromise(elementAt(array, normalized), multiRemote)
    }
    if (normalized < 0 || !Number.isFinite(normalized) || state.metadata.refetch === false) {
        return Array.prototype.at.call(array, normalized)
    }
    if (normalized < array.length) {
        return array[normalized]
    }
    return chainElementPromise(elementAt(array, normalized), multiRemote)
}

async function elementAt (array: ElementList, index: number): Promise<WebdriverIO.Element | undefined> {
    const items = await load(array)
    if (index < 0) {
        return items.at(index) as WebdriverIO.Element | undefined
    }
    if (index < items.length) {
        return items[index] as WebdriverIO.Element
    }

    const { parent, foundWith, selector, refetch } = stateOf(array).metadata
    if (refetch === false || !parent) {
        return undefined
    }

    const browser = getBrowserObject(parent as WebdriverIO.Element)
    return await browser.waitUntil(async () => {
        const query = (parent as unknown as Record<string, (selector?: Selector) => Promise<WebdriverIO.ElementArray>>)[foundWith]
        if (typeof query !== 'function') {
            return false
        }
        const refetched = await query.call(parent, selector as Selector | undefined)
        if (refetched && refetched.length > index) {
            return refetched[index]
        }
        return false
    }, {
        timeout: browser.options?.waitforTimeout,
        timeoutMsg: `Index out of bounds! $$(${String(selector)}) returned only ${items.length} elements.`
    }) as WebdriverIO.Element
}

const methods: Record<string, Function> = {
    async map (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.map(listForIteration(items), callback as Function, thisArg)
    },
    async mapSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.mapSeries(listForIteration(items), callback as Function, thisArg)
    },
    async filter (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const state = stateOf(this)
        const items = await load(this)
        const matched = await asyncIterators.filter(listForIteration(items), callback as Function, thisArg) as WebdriverIO.Element[]
        return fromResolved(matched, derivedMetadata(state.metadata))
    },
    async filterSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const state = stateOf(this)
        const items = await load(this)
        const matched = await asyncIterators.filterSeries(listForIteration(items), callback as Function, thisArg) as WebdriverIO.Element[]
        return fromResolved(matched, derivedMetadata(state.metadata))
    },
    async forEach (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.forEach(listForIteration(items), callback as Function, thisArg)
    },
    async forEachSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.forEachSeries(listForIteration(items), callback as Function, thisArg)
    },
    async find (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.find(listForIteration(items), callback as Function, thisArg)
    },
    async findSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.findSeries(listForIteration(items), callback as Function, thisArg)
    },
    async findIndex (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.findIndex(listForIteration(items), callback as Function, thisArg)
    },
    async findIndexSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.findIndexSeries(listForIteration(items), callback as Function, thisArg)
    },
    async some (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.some(listForIteration(items), callback as Function, thisArg)
    },
    async someSeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.someSeries(listForIteration(items), callback as Function, thisArg)
    },
    async every (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.every(listForIteration(items), callback as Function, thisArg)
    },
    async everySeries (this: ElementList, callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, thisArg?: unknown) {
        const items = await load(this)
        return asyncIterators.everySeries(listForIteration(items), callback as Function, thisArg)
    },
    async reduce (this: ElementList, callback: (accumulator: unknown, value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => unknown, initialValue?: unknown) {
        const items = await load(this)
        return asyncIterators.reduce(listForIteration(items), callback as Function, initialValue)
    },
    entries (this: ElementList) {
        const array = this
        return (async function* entries (): AsyncGenerator<[number, WebdriverIO.Element]> {
            const items = await load(array)
            for (let index = 0; index < items.length; index++) {
                if (index in items) {
                    yield [index, items[index] as WebdriverIO.Element]
                }
            }
        })()
    },
    slice (this: ElementList, start?: number, end?: number) {
        const state = stateOf(this)
        if (state.resolved) {
            return fromResolved(Array.prototype.slice.call(this, start, end) as ElementList, derivedMetadata(state.metadata))
        }
        return fromAsyncCallback(async () => {
            const items = await load(this)
            return items.slice(start, end)
        }, derivedMetadata(state.metadata))
    },
    at (this: ElementList, index: number) {
        return readIndex(this, index)
    },
    async getElements (this: ElementList) {
        await load(this)
        return stateOf(this).self
    }
}

function proxify (array: ElementList, state: ElementArrayState): WebdriverIO.ElementArray {
    const proxy = new Proxy(array, {
        get (target, prop, receiver) {
            const current = stateOf(target)

            /**
             * The wrap hook is a non-configurable property of the raw array.
             * A proxy must return that exact function; binding it violates the
             * invariant and throws when command hooks look the symbol up.
             */
            if (prop === ELEMENT_ARRAY_WRAP) {
                return Reflect.get(target, prop)
            }

            /**
             * the brand of the list, see `@wdio/utils` `kind.ts`. It is read from the
             * metadata, because a chained query learns `isMultiRemote` only when it loads.
             * A pending and a resolved list are the same object, so they have the same kind.
             */
            if (prop === WDIO_KIND) {
                return current.metadata.isMultiRemote ? 'multi-remote-element-array' : 'element-array'
            }

            if (prop === 'then') {
                if (current.resolved) {
                    return undefined
                }
                return (
                    onFulfilled?: (value: WebdriverIO.ElementArray) => unknown,
                    onRejected?: (reason: unknown) => unknown
                ) => load(target).then(
                    () => onFulfilled ? onFulfilled(current.self as WebdriverIO.ElementArray) : current.self,
                    onRejected
                )
            }

            if ((prop === 'catch' || prop === 'finally') && !current.resolved) {
                return (handler?: () => unknown) => {
                    const settled = load(target).then(() => current.self as WebdriverIO.ElementArray)
                    return prop === 'catch' ? settled.catch(handler) : settled.finally(handler)
                }
            }

            if (prop === 'length' && !current.resolved) {
                return load(target).then(() => target.length)
            }

            if (prop === 'selector' || prop === 'parent' || prop === 'foundWith' || prop === 'props') {
                return current.metadata[prop]
            }

            if (prop === 'isMultiRemote') {
                return current.metadata.isMultiRemote === true
            }

            if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                return readIndex(target, Number(prop))
            }

            if (prop === Symbol.iterator) {
                return function* iterator () {
                    if (!stateOf(target).resolved) {
                        throw new Error(
                            'Cannot synchronously iterate over an element list that has not resolved yet. ' +
                            'Use `for await (const el of $$(\'...\')) { ... }` instead.'
                        )
                    }
                    yield* Array.prototype[Symbol.iterator].call(target) as Iterable<WebdriverIO.Element>
                }
            }

            if (prop === Symbol.asyncIterator) {
                return async function* asyncIterator () {
                    const items = await load(target)
                    yield* items
                }
            }

            if (typeof prop === 'string' && RETURN_SELF.has(prop)) {
                return (...args: unknown[]) => {
                    if (!stateOf(target).resolved) {
                        throw new Error(`Cannot ${prop} an element list that has not resolved yet`)
                    }
                    const result = (Array.prototype as unknown as Record<string, Function>)[prop].apply(target, args)
                    return result === target ? current.self : result
                }
            }

            if (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(methods, prop)) {
                return (methods[prop] as Function).bind(target)
            }

            const value = Reflect.get(target, prop, receiver)
            return typeof value === 'function' ? value.bind(target) : value
        },
        /**
         * `parent`, `foundWith` and `getElements` live on the proxy, not the
         * raw array. `in` does not use the get trap, and expect-webdriverio
         * detects an element list with `'getElements' in elements`. Without
         * this, a resolved list looks like a plain array of elements and
         * `elements.map(fn).join()` calls the async map.
         */
        has (target, prop) {
            if (
                prop === WDIO_KIND ||
                prop === 'selector' || prop === 'parent' || prop === 'foundWith' ||
                prop === 'props' || prop === 'isMultiRemote' || prop === 'getElements'
            ) {
                return true
            }
            if (typeof prop === 'string' && (
                RETURN_SELF.has(prop) || Object.prototype.hasOwnProperty.call(methods, prop)
            )) {
                return true
            }
            return Reflect.has(target, prop)
        },
        set (target, prop, value) {
            if (prop === 'parent' || prop === 'selector' || prop === 'foundWith' || prop === 'props') {
                (stateOf(target).metadata as unknown as Record<PropertyKey, unknown>)[prop] = value
                return true
            }
            if (prop === 'isMultiRemote') {
                stateOf(target).metadata.isMultiRemote = Boolean(value)
                return true
            }
            return Reflect.set(target, prop, value, target)
        }
    }) as unknown as WebdriverIO.ElementArray

    state.self = proxy
    return proxy
}

function create (elements: ElementList | undefined, loader: (() => Promise<ElementList>) | undefined, metadata: ElementArrayMetadata) {
    const prepared = prepareMetadata(metadata)
    const array = elements ? [...elements] : []
    const state: ElementArrayState = {
        metadata: prepared,
        resolved: Boolean(elements),
        loader,
        wrappers: []
    }
    states.set(array, state)
    Object.defineProperty(array, ELEMENT_ARRAY_WRAP, {
        configurable: false,
        enumerable: false,
        value: (wrapper: (load: () => Promise<ElementList>) => Promise<ElementList>) => {
            if (state.resolved || state.loading) {
                return
            }
            state.wrappers.push(wrapper)
        }
    })
    return proxify(array, state)
}

/**
 * Element list returned by `$$` and the other multi-element queries.
 *
 * The list is a real array (`Array.isArray` is true) and a thenable until the
 * query finishes, so both of these work:
 *
 * ```ts
 * const elems = await $$('div')
 * for await (const el of $$('div')) {
 *   // ...
 * }
 * ```
 *
 * Async array helpers (`map`, `filter`, `find`, and their `*Series` variants)
 * resolve the list themselves. Index access before the list has resolved
 * returns a chainable element. After it has resolved, an index past the end of
 * an original query still waits and refetches. A slice or a filter does not.
 * `.at()` truncates its index the same way `Array.prototype.at` does.
 */
export const ElementArray = {
    fromAsyncCallback (
        loader: () => Promise<ElementList>,
        metadata: ElementArrayMetadata
    ): WebdriverIO.ElementArray {
        return create(undefined, loader, metadata)
    },
    fromResolved (
        elements: ElementList,
        metadata: ElementArrayMetadata
    ): WebdriverIO.ElementArray {
        return create(elements, undefined, metadata)
    }
}

function fromAsyncCallback (
    loader: () => Promise<ElementList>,
    metadata: ElementArrayMetadata
): WebdriverIO.ElementArray {
    return ElementArray.fromAsyncCallback(loader, metadata)
}

function fromResolved (
    elements: ElementList,
    metadata: ElementArrayMetadata
): WebdriverIO.ElementArray {
    return ElementArray.fromResolved(elements, metadata)
}

/**
 * Chained element queries (`$('parent').$$('child')`) are assembled in
 * `@wdio/utils`, which cannot import this package. Register the constructor
 * so those calls still return an element list.
 */
registerElementArrayFactory((loader, metadata) => {
    return ElementArray.fromAsyncCallback(
        loader as () => Promise<ElementList>,
        metadata as ElementArrayMetadata
    )
})
