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
                console.log('RESOLVE')

                this.#items = items
            })
        }
    }

    async #getItems () {
        if (Array.isArray(this.#items)) {
            return this.#items
        }

        this.#items = await this.#items
        return this.#items as WebdriverIO.Element[]
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
    set length(newLength: number) {
        throw new Error('Operation not supported')
    }

    /**
     * Get an item at a specific index
     */
    async get(index: number): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return items[index]
    }

    /**
     * Set an item at a specific index
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
     * Push one or more elements to the end of the array
     */
    push(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot push elements to the array because it is not yet resolved')
        }

        return this.#items.push(...elements)
    }

    /**
     * Remove and return the last element
     */
    pop(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot pop elements from the array because it is not yet resolved')
        }

        return this.#items.pop()
    }

    /**
     * Add one or more elements to the beginning of the array
     */
    unshift(...elements: WebdriverIO.Element[]): number {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot unshift elements to the array because it is not yet resolved')
        }

        return this.#items.unshift(...elements)
    }

    /**
     * Remove and return the first element
     */
    shift(): WebdriverIO.Element | undefined {
        if (!Array.isArray(this.#items)) {
            throw new Error('Cannot shift elements from the array because it is not yet resolved')
        }

        return this.#items.shift()
    }

    /**
     * Return a new array with the results of calling a provided function
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
     * Return a new array with all elements that pass the test
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
     */
    async join(separator: string = ','): Promise<string> {
        const items = await this.#getItems()
        return items.map((el) => el.elementId).join(separator)
    }

    /**
     * Get a slice of the array
     */
    slice(start?: number, end?: number): ElementArray {
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
     */
    splice(start: number, deleteCount?: number, ...items: WebdriverIO.Element[]): ElementArray {
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
     */
    async find(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return asyncIterators.find(items, callback)
    }

    /**
     * Find the first element that satisfies the provided testing function in series
     */
    async findSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<WebdriverIO.Element | undefined> {
        const items = await this.#getItems()
        return asyncIterators.findSeries(items, callback)
    }

    /**
     * Find the index of the first element that satisfies the provided testing function
     */
    async findIndex(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<number> {
        const items = await this.#getItems()
        return asyncIterators.findIndex(items, callback)
    }

    /**
     * Find the index of the first element that satisfies the provided testing function in series
     */
    async findIndexSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<number> {
        const items = await this.#getItems()
        return asyncIterators.findIndexSeries(items, callback)
    }

    /**
     * Check if at least one element in the array satisfies the provided testing function
     */
    async some(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.some(items, callback)
    }

    /**
     * Check if at least one element in the array satisfies the provided testing function in series
     */
    async someSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.someSeries(items, callback)
    }

    /**
     * Check if all elements in the array satisfy the provided testing function
     */
    async every(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.every(items, callback)
    }

    /**
     * Check if all elements in the array satisfy the provided testing function in series
     */
    async everySeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => boolean): Promise<boolean> {
        const items = await this.#getItems()
        return asyncIterators.everySeries(items, callback)
    }

    /**
     * Execute a function on each element in the array
     */
    async forEach(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => void): Promise<void> {
        const items = await this.#getItems()
        return asyncIterators.forEach(items, callback)
    }

    /**
     * Execute a function on each element in the array in series
     */
    async forEachSeries(callback: (value: WebdriverIO.Element, index: number, array: WebdriverIO.Element[]) => void): Promise<void> {
        const items = await this.#getItems()
        return asyncIterators.forEachSeries(items, callback)
    }

    /**
     * Custom string representation of the array
     */
    toString(): string {
        const details = Array.isArray(this.#items)
            ? `${this.#items.length}/${this.#metadata.selector}`
            : 'pending'
        return `WebdriverIO.Element(${details})`
    }

    /**
     * Custom inspection that includes the selector information
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
    static from(array: WebdriverIO.Element[]): ElementArray {
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
    ): ElementArray {
        return new ElementArray(callback(), metadata)
    }
}
