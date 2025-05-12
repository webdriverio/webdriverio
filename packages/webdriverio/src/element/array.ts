import { asyncIterators } from '@wdio/utils'
import type { Selector } from '../types.js'

interface ElementArrayMetadata {
    selector: Selector,
    parent?: WebdriverIO.Element | WebdriverIO.Browser
}

/**
 * CustomArray - A TypeScript implementation of an array-like structure
 * with overridable behavior.
 */
export class ElementArray implements Iterable<WebdriverIO.Element> {
    #items: WebdriverIO.Element[] | Promise<WebdriverIO.Element[]>
    #metadata: ElementArrayMetadata

    /**
     * Constructor - Initialize with optional elements
     */
    constructor(elements: WebdriverIO.Element[] | Promise<WebdriverIO.Element[]>, metadata: ElementArrayMetadata) {
        this.#items = elements
        this.#metadata = metadata

        if (!Array.isArray(elements)) {
            elements.then((items) => {
                this.#items = items
            })
        }
    }

    async #getItems (): Promise<WebdriverIO.Element[]> {
        if (Array.isArray(this.#items)) {
            return this.#items
        }

        this.#items = await this.#items
        return this.#items
    }

    /**
     * selector used to fetch this element, can be
     * - undefined if element was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     * - a string if `findElement` was used and a reference was found
     * - or a function if element was found via e.g. `$(() => document.body)`
     */
    get selector() {
        return this.#metadata.selector
    }

    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    get parent() {
        return this.#metadata.parent
    }

    /**
     * Get the length of the array
     */
    get length(): number {
        return Array.isArray(this.#items)
            ? this.#items.length
            : 0
    }

    /**
     * Set the length of the array (truncates or extends with undefined)
     */
    set length(_: number) {
        throw new Error('Operation not supported')
    }

    /**
     * Get an item at a specific index
     * @param index - The index of the item to get
     * @returns The item at the specified index
     */
    async get(index: number): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return items[index]
    }

    /**
     * Get an item at a specific index
     * @param index - The index of the item to get
     * @returns The item at the specified index
     */
    async at(index: number): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return items.at(index)
    }

    /**
     * returns the first index at which a given element can be found in the array, or -1 if it is not present.
     * @param element - The element to search for
     * @returns The index of the element, or -1 if it is not present
     */
    async indexOf(element: WebdriverIO.Element): Promise<number> {
        const items = (await this.#getItems()).map((el) => el.elementId)
        return items.indexOf(element.elementId)
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
        if (!Array.isArray(this.#items)) {
            throw new Error(`Cannot set element at index ${index} because the array is not yet resolved`)
        }

        this.#items[index] = value
    }

    /**
     * Access using array notation (getter)
     */
    [Symbol.iterator](): Iterator<WebdriverIO.Element> {
        if (!Array.isArray(this.#items)) {
            throw new Error(
                'Cannot synchronously iterate over the array because it is not yet resolved. ' +
                'Use async iteration instead, e.g. `await for(const el of $$(\'...\')) { ... }'
            )
        }

        return this.#items[Symbol.iterator]()
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
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot get entries of the array because it is not yet resolved')
        }

        return this.#items.entries()
    }

    /**
     * Push one or more elements to the end of the array
     * @param elements - The elements to push
     * @returns The new length of the array
     */
    push(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot push elements to the array because it is not yet resolved')
        }

        return this.#items.push(...elements)
    }

    /**
     * Remove and return the last element
     * @returns The last element of the array, or undefined if the array is empty
     */
    pop(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot pop elements from the array because it is not yet resolved')
        }

        return this.#items.pop()
    }

    /**
     * Add one or more elements to the beginning of the array
     * @param elements - The elements to add
     * @returns The new length of the array
     */
    unshift(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot unshift elements to the array because it is not yet resolved')
        }

        return this.#items.unshift(...elements)
    }

    /**
     * Remove and return the first element
     * @returns The first element of the array, or undefined if the array is empty
     */
    shift(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot shift elements from the array because it is not yet resolved')
        }

        return this.#items.shift()
    }

    /**
     * reverses an array in place and returns the reference to the same array,
     * the first array element now becoming the last, and the last array element
     * becoming the first. In other words, elements order in the array will be
     * turned towards the direction opposite to that previously stated.
     * @returns The same object but with reversed elements
     */
    reverse(): WebdriverIO.ElementArray {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        this.#items = this.#items.reverse()
        return this
    }

    /**
     * is the copying counterpart of the reverse() method. It returns a new array with the elements in reversed order.
     * @returns A new array with the elements in reversed order
     */
    toReversed(): WebdriverIO.ElementArray {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        return new ElementArray(this.#items.toReversed(), this.#metadata)
    }

    with (index: number, element: WebdriverIO.Element): WebdriverIO.ElementArray {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot reverse the array because it is not yet resolved')
        }

        return new ElementArray(this.#items.with(index, element), this.#metadata)
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
        ) => U
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
        ) => U
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
        ) => boolean
    ): Promise<ElementArray> {
        const items = await this.#getItems()
        const newItems = await asyncIterators.filter(items, callback)
        const result = new ElementArray([], this.#metadata)
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
        ) => boolean
    ): Promise<ElementArray> {
        const items = await this.#getItems()
        const newItems = await asyncIterators.filterSeries(items, callback)
        const result = new ElementArray([], this.#metadata)
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
        ) => InitialValue,
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
        }, this.#metadata)
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
        }, this.#metadata)
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
    async forEach(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => void | Promise<void>): Promise<void> {
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
        const details = Array.isArray(this.#items)
            ? `${this.#items.length}/${this.#metadata.selector}`
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

    /**
     * Create a ElementArray from a regular array
     */
    static from(array: WebdriverIO.Element[]): WebdriverIO.ElementArray {
        const firstElem = array[0]
        if (!firstElem) {
            throw new Error('at least one element expected')
        }

        return new ElementArray(array, {
            selector: firstElem.selector,
            parent: firstElem.parent
        })
    }

    static fromAsyncCallback(
        callback: (() => Promise<WebdriverIO.Element[]>),
        metadata: ElementArrayMetadata
    ): WebdriverIO.ElementArray {
        return new ElementArray(callback(), metadata)
    }
}
