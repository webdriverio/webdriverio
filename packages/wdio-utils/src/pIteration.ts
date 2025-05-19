/**
 * Implements ES5 [`Array#forEach()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) method.<br><br>
 * Executes the provided callback once for each element.<br>
 * Callbacks are run concurrently,
 * and are only invoked for properties of the array that have been initialized (including those initialized with *undefined*), for unassigned ones `callback` is not run.<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with undefined value.
 */
export const forEach = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any
) => {
    const promiseArray = []
    for (let i = 0; i < array.length; i++) {
        if (i in array) {
            const p = Promise.resolve(array[i]).then((currentValue) => {
                return callback.call(thisArg || this, currentValue, i, array)
            })
            promiseArray.push(p)
        }
    }
    await Promise.all(promiseArray)
}

/**
 * Same functionality as [`forEach()`](global.html#forEach), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with undefined value.
 */
export const forEachSeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any
): Promise<void> => {
    for (let i = 0; i < array.length; i++) {
        if (i in array) {
            await callback.call(thisArg || this, await array[i], i, array)
        }
    }
}

/**
 * Implements ES5 [`Array#map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) method.<br><br>
 * Creates a new array with the results of calling the provided callback once for each element.<br>
 * Callbacks are run concurrently,
 * and are only invoked for properties of the array that have been initialized (including those initialized with *undefined*), for unassigned ones`callback` is not run.<br>
 * Resultant *Array* is always the same *length* as the original one.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the resultant *Array* as value.
 */
export const map = async <T, U>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => Promise<U> | U,
    thisArg?: T
): Promise<U[]> => {
    const promiseArray = []
    for (let i = 0; i < array.length; i++) {
        if (i in array) {
            promiseArray[i] = Promise.resolve(array[i]).then((currentValue) => {
                return callback.call(thisArg || this, currentValue, i, array)
            })
        }
    }
    return Promise.all(promiseArray)
}

/**
 * Same functionality as [`map()`](global.html#map), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the resultant *Array* as value.
 */
export const mapSeries = async <T, U>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => Promise<U> | U,
    thisArg?: T
): Promise<U[]> => {
    const result = []
    for (let i = 0; i < array.length; i++) {
        if (i in array) {
            result[i] = await callback.call(thisArg || this, await array[i], i, array)
        }
    }
    return result
}

/**
 * Implements ES5 [`Array#find()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find) method.<br><br>
 * Returns the value of the element that satisfies the provided `callback`. The value returned is the one found first.<br>
 * Callbacks are run concurrently, meaning that all the callbacks are going to run even if the returned value is found in one of the first elements of `array`,
 * depending on the async calls you are going to use, consider using instead [`findSeries()`](global.html#findSeries).<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the element that passed the test as value, otherwise *undefined*.
 */
export const find = <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<T | undefined> => {
    return new Promise<T | undefined>((resolve, reject) => {
        if (array.length === 0) {
            return resolve(undefined)
        }
        let counter = 1
        for (let i = 0; i < array.length; i++) {
            const check = (found: boolean) => {
                if (found) {
                    resolve(array[i])
                } else if (counter === array.length) {
                    resolve(undefined)
                }
                counter++
            }
            Promise.resolve(array[i])
                .then((elem) => callback.call(thisArg || this, elem, i, array))
                .then(check)
                .catch(reject)
        }
    })
}

/**
 * Same functionality as [`find()`](global.html#find), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the element that passed the test as value, otherwise *undefined*.
 */
export const findSeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<T | undefined> => {
    for (let i = 0; i < array.length; i++) {
        if (await callback.call(thisArg || this, await array[i], i, array)) {
            return array[i]
        }
    }
}

/**
 * Implements ES5 [`Array#findIndex()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex) method.<br><br>
 * Returns the index of the element that satisfies the provided `callback`. The index returned is the one found first.<br>
 * Callbacks are run concurrently, meaning that all the callbacks are going to run even if the returned index is found in one of the first elements of `array`,
 * depending on the async calls you are going to use, consider using instead [`findSeries()`](global.html#findSeries).<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the index that passed the test as value, otherwise *-1*.
 */
export const findIndex = <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<number> => {
    return new Promise((resolve, reject) => {
        if (array.length === 0) {
            return resolve(-1)
        }
        let counter = 1
        for (let i = 0; i < array.length; i++) {
            const check = (found: boolean) => {
                if (found) {
                    resolve(i)
                } else if (counter === array.length) {
                    resolve(-1)
                }
                counter++
            }
            Promise.resolve(array[i])
                .then((elem) => callback.call(thisArg || this, elem, i, array))
                .then(check)
                .catch(reject)
        }
    })
}

/**
 * Same functionality as [`findIndex()`](global.html#findIndex), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the index that passed the test, otherwise *-1*.
 */
export const findIndexSeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<number> => {
    for (let i = 0; i < array.length; i++) {
        if (await callback.call(thisArg || this, await array[i], i, array)) {
            return i
        }
    }

    return -1
}

/**
 * Implements ES5 [`Array#some()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some) method.<br><br>
 * Test if some element in `array` passes the test implemented in `callback`.<br>
 * Callbacks are run concurrently, meaning that all the callbacks are going to run even if some of the first elements pass the test,
 * depending on the async calls you are going to use, consider using instead [`someSeries()`](global.html#someSeries).<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with *true* as value if some element passed the test, otherwise *false*.
 */
export const some = <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if (array.length === 0) {
            return resolve(false)
        }
        let counter = 1
        for (let i = 0; i < array.length; i++) {
            if (!(i in array)) {
                counter++
                continue
            }
            const check = (found: boolean) => {
                if (found) {
                    resolve(true)
                } else if (counter === array.length) {
                    resolve(false)
                }
                counter++
            }
            Promise.resolve(array[i])
                .then((elem) => callback.call(thisArg || this, elem, i, array))
                .then(check)
                .catch(reject)
        }
    })
}

/**
 * Same functionality as [`some()`](global.html#some), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with *true* as value if some element passed the test, otherwise *false*.
 */
export const someSeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<boolean> => {
    for (let i = 0; i < array.length; i++) {
        if (i in array && await callback.call(thisArg || this, await array[i], i, array)) {
            return true
        }
    }
    return false
}

/**
 * Implements ES5 [`Array#every()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every) method.<br><br>
 * Test if all elements in `array` pass the test implemented in `callback`.<br>
 * Callbacks are run concurrently, meaning that all the callbacks are going to run even if any of the first elements do not pass the test,
 * depending on the async calls you are going to use, consider using instead [`everySeries()`](global.html#everySeries).<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with *true* as value if all elements passed the test, otherwise *false*.
 */
export const every = <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        if (array.length === 0) {
            return resolve(true)
        }
        let counter = 1
        for (let i = 0; i < array.length; i++) {
            if (!(i in array)) {
                counter++
                continue
            }
            const check = (found: boolean) => {
                if (!found) {
                    resolve(false)
                } else if (counter === array.length) {
                    resolve(true)
                }
                counter++
            }
            Promise.resolve(array[i])
                .then((elem) => callback.call(thisArg || this, elem, i, array))
                .then(check)
                .catch(reject)
        }
    })
}

/**
 * Same functionality as [`every()`](global.html#every), but runs only one callback at a time.<br><br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with *true* as value if all elements passed the test, otherwise *false*.
 */
export const everySeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => boolean | Promise<boolean>,
    thisArg?: T
): Promise<boolean> => {
    for (let i = 0; i < array.length; i++) {
        if (i in array && !await callback.call(thisArg || this, await array[i], i, array)) {
            return false
        }
    }
    return true
}

/**
 * Implements ES5 [`Array#filter()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) method.<br><br>
 * Creates a new array with the elements that passed the test implemented in `callback`.<br>
 * Callbacks are run concurrently.<br>
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @param {Object} [thisArg] - Value to use as *this* when executing the `callback`.
 * @return {Promise} - Returns a Promise with the resultant filtered *Array* as value.
 */
export const filter = <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => Promise<boolean | undefined> | boolean | undefined,
    thisArg?: T
): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const filterResults: Promise<boolean>[] = []
        for (let i = 0; i < array.length; i++) {
            if (i in array) {
                filterResults[i] = Promise.resolve(array[i])
                    .then((currentValue) => callback.call(thisArg || this, currentValue, i, array))
                    .then((result) => result !== undefined ? !!result : false)
            }
        }

        return Promise.all(filterResults).then((results) => {
            return array.filter((_, i) => results[i])
        }).then(async (returnVal) => resolve(await Promise.all(returnVal)), reject)
    })
}

/**
 * Same functionality as [`filter()`](global.html#filter), but runs only one callback at a time.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts three arguments: `currentValue`, `index` and `array`.
 * @return {Promise} - Returns a Promise with the resultant filtered *Array* as value.
 */
export const filterSeries = async <T>(
    array: T[],
    callback: (value: Awaited<T>, index: number, array: T[]) => Promise<boolean> | boolean,
    thisArg?: T
): Promise<T[]> => {
    const result = []
    for (let i = 0; i < array.length; i++) {
        if (i in array && await callback.call(thisArg || this, await array[i], i, array)) {
            result.push(await array[i])
        }
    }
    return result
}

/**
 * Implements ES5 [`Array#reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) method.<br><br>
 * Applies a `callback` against an accumulator and each element in `array`.
 * @param {Array} array - Array to iterate over.
 * @param {Function} callback - Function to apply each item in `array`. Accepts four arguments: `accumulator`, `currentValue`, `currentIndex` and `array`.
 * @param {Object} [initialValue] - Used as first argument to the first call of `callback`.
 * @return {Promise} - Returns a Promise with the resultant value from the reduction.
 */
export async function reduce<T, U>(
    array: U[],
    callback: (
        previousValue: unknown,
        currentValue: U,
        currentIndex: number,
        array: U[]
    ) => unknown
): Promise<T>
export async function reduce<T, U>(
    array: U[],
    callback: (
        previousValue: T,
        currentValue: U,
        currentIndex: number,
        array: U[]
    ) => Promise<T> | T,
    initialValue: T | Promise<T>
): Promise<T>
export async function reduce<T, U>(
    array: U[],
    callback: (
        previousValue: T,
        currentValue: U,
        currentIndex: number,
        array: U[]
    ) => T,
    initialValue?: T
): Promise<T> {
    if (array.length === 0) {
        if (typeof initialValue === 'undefined') {
            throw new Error('Reduce of empty array with no initial value')
        }

        return initialValue as T
    }

    if (typeof initialValue === 'undefined' && array.length === 1) {
        return array[0] as unknown as T
    }

    let previousValue = await (typeof initialValue === 'undefined' ? array[0] : initialValue) as T
    for (let i = 0; i < array.length; i++) {
        /**
         * If the initial value is not provided, we skip the first element
         * because it's already used as the initial value
         */
        if (typeof initialValue === 'undefined' && i === 0) {
            continue
        }

        if (i in array) {
            previousValue = await callback(previousValue as T, await array[i], i, array)
        }
    }
    return previousValue as T
}
