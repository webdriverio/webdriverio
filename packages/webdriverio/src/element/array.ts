import { asyncIterators } from '@wdio/utils'
import type { Selector } from '../types.js'

interface ElementArrayMetadata {
    selector: Selector,
    foundWith: string,
    parent?: WebdriverIO.Element | WebdriverIO.Browser
}

/**
 * CustomArray - A TypeScript implementation of an array-like structure
 * with overridable behavior.
 */
export class ElementArray implements Iterable<WebdriverIO.Element> {
    private _items: WebdriverIO.Element[] | Promise<WebdriverIO.Element[]>
    private _metadata: ElementArrayMetadata

    /**
     * Constructor - Initialize with optional elements
     */
    constructor(
        elements: WebdriverIO.Element[] | Promise<WebdriverIO.Element[]>,
        metadata: ElementArrayMetadata
    ) {
        this._items = elements
        this._metadata = metadata

        if (!Array.isArray(elements)) {
            elements.then((items) => {
                this._items = items
            })
        }
    }

    async resolve() {
        await this.#getItems()
    }

    get isResolved() {
        return Array.isArray(this._items)
    }

    async #getItems (): Promise<WebdriverIO.Element[]> {
        if (Array.isArray(this._items)) {
            return this._items
        }

        this._items = await this._items
        return this._items
    }

    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a function if element was found via e.g. `$(() => document.body)`
     */
    get selector() {
        return this._metadata.selector
    }

    /**
     * indicates if the element was queried with a special command, e.g. `custom$$` or `react$$`
     * @default $$
     */
    get foundWith() {
        return this._metadata.foundWith
    }

    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    get parent() {
        return this._metadata.parent
    }

    /**
     * Get the length of the array
     */
    get length(): number {
        return Array.isArray(this._items)
            ? this._items.length
            : 0
    }

    /**
     * Set the length of the array (truncates or extends with undefined)
     */
    set length(_: number) {
        throw new Error('Operation not supported')
    }

    /**
     * @deprecated not needed anymore, you can now access the elements directly
     */
    async getElements(): Promise<WebdriverIO.ElementArray> {
        return this as unknown as WebdriverIO.ElementArray
    }

    /**
     * Get an item at a specific index
     * @param index - The index of the item to get
     * @returns The item at the specified index
     */
    at(index: number): WebdriverIO.Element | undefined | Promise<WebdriverIO.Element | undefined> {
        if (this.isResolved) {
            return (this._items as WebdriverIO.Element[]).at(index)
        }
        return this.#getItems().then((items) => items.at(index))
    }

    /**
     * returns the first index at which a given element can be found in the array, or -1 if it is not present.
     * @param element - The element to search for
     * @returns The index of the element, or -1 if it is not present
     */
    indexOf(element: WebdriverIO.Element): number | Promise<number> {
        if (this.isResolved) {
            return (this._items as WebdriverIO.Element[]).map((el) => el.elementId).indexOf(element.elementId)
        }
        return this.#getItems().then((items) => items.map((el) => el.elementId)).then((ids) => ids.indexOf(element.elementId))
    }

    /**
     * returns the last index at which a given element can be found in the array, or -1 if it is not present.
     * @param element - The element to search for
     * @returns The index of the element, or -1 if it is not present
     */
    async lastIndexOf(element: WebdriverIO.Element): Promise<number> {
        const items = (await this.#getItems()).map((el) => el.elementId)
        return items.lastIndexOf(element.elementId)
    }

    /**
     * Set an item at a specific index
     * @param index - The index of the item to set
     * @param value - The value to set
     */
    set(index: number, value: WebdriverIO.Element): void {
        if (!Array.isArray(this._items)) {
            throw new Error(`Cannot set element at index ${index} because the array is not yet resolved`)
        }

        this._items[index] = value
    }

    /**
     * Access using array notation (getter)
     */
    [Symbol.iterator](): Iterator<WebdriverIO.Element> {
        if (!Array.isArray(this._items)) {
            throw new Error(
                'Cannot synchronously iterate over the array because it is not yet resolved. ' +
                'Use async iteration instead, e.g. `await for(const el of $$(\'...\')) { ... }'
            )
        }

        return this._items[Symbol.iterator]()
    }

    /**
     * Asynchronous iteration support
     */
    async *[Symbol.asyncIterator](): AsyncIterator<WebdriverIO.Element> {
        const items = await this.#getItems()
        for (const item of items) {
            yield item
        }
    }

    /**
     * Get an iterator over the elements in the array
     * @returns An iterator over the elements in the array
     */
    entries(): IterableIterator<[number, WebdriverIO.Element]> {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot get entries of the array because it is not yet resolved')
        }

        return this._items.entries()
    }

    /**
     * Push one or more elements to the end of the array
     * @param elements - The elements to push
     * @returns The new length of the array
     */
    push(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot push elements to the array because it is not yet resolved')
        }

        return this._items.push(...elements)
    }

    /**
     * Remove and return the last element
     * @returns The last element of the array, or undefined if the array is empty
     */
    pop(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot pop elements from the array because it is not yet resolved')
        }

        return this._items.pop()
    }

    /**
     * Add one or more elements to the beginning of the array
     * @param elements - The elements to add
     * @returns The new length of the array
     */
    unshift(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot unshift elements to the array because it is not yet resolved')
        }

        return this._items.unshift(...elements)
    }

    /**
     * Remove and return the first element
     * @returns The first element of the array, or undefined if the array is empty
     */
    shift(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot shift elements from the array because it is not yet resolved')
        }

        return this._items.shift()
    }

    /**
     * reverses an array in place and returns the reference to the same array,
     * the first array element now becoming the last, and the last array element
     * becoming the first. In other words, elements order in the array will be
     * turned towards the direction opposite to that previously stated.
     * @returns The same object but with reversed elements
     */
    reverse(): WebdriverIO.ElementArray {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        this._items = this._items.reverse()
        return this as unknown as WebdriverIO.ElementArray
    }

    /**
     * is the copying counterpart of the reverse() method. It returns a new array with the elements in reversed order.
     * @returns A new array with the elements in reversed order
     */
    toReversed(): WebdriverIO.ElementArray {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        return ElementArray.createProxy(this._items.toReversed(), this._metadata)
    }

    with (index: number, element: WebdriverIO.Element): WebdriverIO.ElementArray {
        if (!Array.isArray(this._items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        return ElementArray.createProxy(this._items.with(index, element), this._metadata)
    }

    /**
     * Return a new array with the results of calling a provided function
     * @param callback - The function to call on each element
     * @returns A new array with the results of calling the provided function
     */
    async map<U>(
        callback: (
            value: WebdriverIO.Element,
            index: number,
            array: WebdriverIO.Element[]
        ) => Promise<U> | U
    ): Promise<U[]> {
        const items = await this.#getItems()
        return asyncIterators.map<WebdriverIO.Element, U>(items, callback)
    }

    /**
     * Return a new array with the results of calling a provided function in series
     * @param callback - The function to call on each element
     * @returns A new array with the results of calling the provided function
     */
    async mapSeries<U>(
        callback: (
            value: WebdriverIO.Element,
            index: number,
            array: WebdriverIO.Element[]
        ) => Promise<U> | U
    ): Promise<U[]> {
        const items = await this.#getItems()
        return asyncIterators.mapSeries<WebdriverIO.Element, U>(items, callback)
    }

    /**
     * Return a new array with all elements that pass the test
     * @param callback - The function to call on each element
     * @returns A new array with the results of calling the provided function
     */
    async filter(
        callback: (
            value: WebdriverIO.Element,
            index: number,
            array: WebdriverIO.Element[]
        ) => boolean | Promise<boolean>
    ): Promise<WebdriverIO.ElementArray> {
        const items = await this.#getItems()
        const newItems = await asyncIterators.filter(items, callback)
        const result = ElementArray.createProxy([], this._metadata)
        result.push(...newItems)
        return result
    }

    /**
     * Return a new array with all elements that pass the test in series
     * @param callback - The function to call on each element
     * @returns A new array with the results of calling the provided function
     */
    async filterSeries(
        callback: (
            value: WebdriverIO.Element,
            index: number,
            array: WebdriverIO.Element[]
        ) => boolean | Promise<boolean>
    ): Promise<WebdriverIO.ElementArray> {
        const items = await this.#getItems()
        const newItems = await asyncIterators.filterSeries(items, callback)
        const result = ElementArray.createProxy([], this._metadata)
        result.push(...newItems)
        return result
    }

    /**
     * Executes a reducer function on each element, resulting in a single output value
     * @param callback - The function to call on each element
     * @returns A new array with the results of calling the provided function
     */
    async reduce<InitialValue>(
        callback: (
            accumulator: InitialValue,
            currentValue: WebdriverIO.Element,
            currentIndex: number,
            array: WebdriverIO.Element[]
        ) => InitialValue | Promise<InitialValue>,
        initialValue: InitialValue
    ): Promise<InitialValue> {
        const items = await this.#getItems()
        return asyncIterators.reduce<InitialValue, WebdriverIO.Element>(items, callback, initialValue)
    }

    /**
     * Join all elements references into a string
     * @param separator - The separator to use between elements
     * @returns A string with all elements joined by the separator
     */
    async join(separator: string = ','): Promise<string> {
        const items = await this.#getItems()
        return items.map((el) => el.elementId).join(separator)
    }

    /**
     * Get a slice of the array
     * @param start - The start index of the slice
     * @param end - The end index of the slice
     * @returns A new array with the results of calling the provided function
     */
    slice(start?: number, end?: number): WebdriverIO.ElementArray {
        return ElementArray.fromAsyncCallback(async () => {
            const result: WebdriverIO.Element[] = []
            const items = await this.#getItems()
            const sliced = items.slice(start, end)
            result.push(...sliced)
            return result
        }, this._metadata)
    }

    /**
     * Change the contents of an array by removing, replacing, or adding elements
     * @param start - The start index of the slice
     * @param deleteCount - The number of elements to remove
     * @param items - The elements to add
     * @returns A new array with the results of calling the provided function
     */
    splice(start: number, deleteCount?: number, ...items: WebdriverIO.Element[]): WebdriverIO.ElementArray {
        return ElementArray.fromAsyncCallback(async () => {
            const resolvedItems = await this.#getItems()
            const result: WebdriverIO.Element[] = []
            const removed = resolvedItems.splice(start, deleteCount || 0, ...items)
            result.push(...removed)
            return result
        }, this._metadata)
    }

    /**
     * Find the first element that satisfies the provided testing function
     * @param callback - The function to call on each element
     * @returns The first element that satisfies the provided testing function, or undefined if no such element is found
     */
    async find(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return asyncIterators.find(items, callback)
    }

    /**
     * Find the first element that satisfies the provided testing function in series
     * @param callback - The function to call on each element
     * @returns The first element that satisfies the provided testing function, or undefined if no such element is found
     */
    async findSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return asyncIterators.findSeries(items, callback)
    }

    /**
     * Find the index of the first element that satisfies the provided testing function
     * @param callback - The function to call on each element
     * @returns The index of the first element that satisfies the provided testing function, or -1 if no such element is found
     */
    async findIndex(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<number> {
        const items = await this.#getItems()
        return asyncIterators.findIndex(items, callback)
    }

    /**
     * Find the index of the first element that satisfies the provided testing function in series
     * @param callback - The function to call on each element
     * @returns The index of the first element that satisfies the provided testing function, or -1 if no such element is found
     */
    async findIndexSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<number> {
        const items = await this.#getItems()
        return asyncIterators.findIndexSeries(items, callback)
    }

    /**
     * Check if at least one element in the array satisfies the provided testing function
     * @param callback - The function to call on each element
     * @returns true if at least one element satisfies the provided testing function, otherwise false
     */
    async some(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.some(items, callback)
    }

    /**
     * Check if at least one element in the array satisfies the provided testing function in series
     * @param callback - The function to call on each element
     * @returns true if at least one element satisfies the provided testing function, otherwise false
     */
    async someSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.someSeries(items, callback)
    }

    /**
     * Check if all elements in the array satisfy the provided testing function
     * @param callback - The function to call on each element
     * @returns true if all elements satisfy the provided testing function, otherwise false
     */
    async every(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.every(items, callback)
    }

    /**
     * Check if all elements in the array satisfy the provided testing function in series
     * @param callback - The function to call on each element
     * @returns true if all elements satisfy the provided testing function, otherwise false
     */
    async everySeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean | Promise<boolean>): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.everySeries(items, callback)
    }

    /**
     * Execute a function on each element in the array
     * @param callback - The function to call on each element
     * @returns void
     */
    async forEach(
        callback: (
            value: WebdriverIO.Element,
            index: number,
            array: WebdriverIO.Element[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) => any
    ): Promise<void> {
        const items = await this.#getItems()
        return asyncIterators.forEach(items, callback)
    }

    /**
     * Execute a function on each element in the array in series
     * @param callback - The function to call on each element
     * @returns void
     */
    async forEachSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => void | Promise<void>): Promise<void> {
        const items = await this.#getItems()
        return asyncIterators.forEachSeries(items, callback)
    }

    /**
     * Custom string representation of the array
     * @returns A string representation of the array
     */
    toString(): string {
        const details = Array.isArray(this._items)
            ? `${this._items.length}/${this._metadata.selector}`
            : 'pending'
        return `WebdriverIO.Element(${details})`
    }

    /**
     * Custom inspection that includes the selector information
     * @returns A string representation of the array
     */
    [Symbol.for('nodejs.util.inspect.custom')](): string {
        return this.toString()
    }

    /**
     * Symbol.toPrimitive is used when an object is converted to a primitive value
     * This affects how the object is displayed in console.log
     */
    [Symbol.toPrimitive](hint: string): number | string {
        if (hint === 'string') {
            return this.toString()
        }
        if (hint === 'number') {
            return this.length
        }
        return this.toString()
    }

    static fromAsyncCallback(
        callback: (() => Promise<WebdriverIO.Element[]>),
        metadata: ElementArrayMetadata
    ): WebdriverIO.ElementArray {
        return ElementArray.createProxy(callback(), metadata)
    }

    /**
     * Create a proxy for the ElementArray to support numeric and string indexing
     * @param elements - The elements to create the proxy for
     * @param metadata - The metadata for the proxy
     * @returns A proxy for the ElementArray
     */
    static createProxy(
        elements: WebdriverIO.Element[] | Promise<WebdriverIO.Element[]>,
        metadata: ElementArrayMetadata
    ): WebdriverIO.ElementArray {
        const instance = new ElementArray(elements, metadata)
        return new Proxy(instance, {
            get(target, prop, receiver) {
                if (prop === 'then') {
                    if (target.isResolved) {
                        return
                    }

                    return async (callback: (elements: WebdriverIO.ElementArray) => void | Promise<void>) => {
                        await target.resolve()
                        return callback(receiver)
                    }
                }

                // If prop is a numeric string, treat it as an index
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    return target.at(Number(prop))

                // If prop is a number, treat it as an index
                } else if (typeof prop === 'number') {
                    return target.at(prop)
                }

                // Otherwise, default behavior
                return Reflect.get(target, prop, receiver)
            }
        }) as WebdriverIO.ElementArray
    }
}