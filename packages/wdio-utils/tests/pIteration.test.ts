import { test, expect } from 'vitest'
import {
    forEach, map, find, findIndex, some, every, filter, reduce,
    forEachSeries, mapSeries, findSeries, findIndexSeries, someSeries,
    everySeries, filterSeries
} from '../src/pIteration.js'

const delay = (ms?: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms || 0))

test('forEach, check callbacks are run in parallel', async () => {
    let total = 0
    const parallelCheck: number[] = []
    await forEach([2, 1, 3], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        parallelCheck.push(num)
        total += num
    })
    expect(parallelCheck).toEqual([1, 2, 3])
    expect(total).toBe(6)
})

test('forEach passing a non-async function', async () => {
    let total = 0
    await forEach([2, 1, 3], (num: number, index: number, array: number[]) => {
        expect(array[index]).toBe(num)
        total += num
    })
    expect(total).toBe(6)
})

test('forEach unwraps Promises in the array', async () => {
    let total = 0
    await forEach([2, Promise.resolve(1), 3], async (num: number, index: number, array: number[]) => {
        expect(await Promise.resolve(array[index])).toBe(num)
        total += num
    })
    expect(total).toBe(6)
})

test('forEach should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await forEach([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('forEach, throw inside callback', async function () {
    await expect(forEach([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('forEach using thisArg', async () => {
    let total = 0
    const testObj = { test: 1 }
    await forEach([1, 2, 3], async function (this: unknown, num: number, index: number, array: number[]) {
        await delay()
        expect(array[index]).toBe(num)
        expect(this).toEqual(testObj)
        total += num
    }, testObj)
    expect(total).toBe(6)
})

test('forEach used with promises in a non-async function', async () => {
    let total = 0
    try {
        await forEach([1, 2, 3], async function (num: number, index: number, array: number[]) {
            await delay()
            expect(array[index]).toBe(num)
            total += num
        })
    } catch (err) {
        // ignore
    }
    expect(total).toBe(6)
})

test('forEach should not execute any callback if array is empty', async () => {
    let count = 0
    await forEach([], async () => {
        await delay()
        count++
    })
    expect(count).toBe(0)
})

test('forEach should skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    await forEach([0, 1, 2, , 5, ,], async () => {
        count++
    })
    expect(count).toBe(4)
})

test('map, check callbacks are run in parallel', async () => {
    const parallelCheck: number[] = []
    const arr = await map([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        parallelCheck.push(num)
        return num * 2
    })
    expect(arr).toEqual([6, 2, 4])
    expect(parallelCheck).toEqual([1, 2, 3])
})

test('map unwraps Promises in the array', async () => {
    const arr = await map([2, Promise.resolve(1), 3], async (num: number, index: number, array: number[]) => {
        expect(await Promise.resolve(array[index])).toBe(num)
        return num * 2
    })
    expect(arr).toEqual([4, 2, 6])
})

test('map should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await map([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('map passing a non-async function that return a promise', async () => {
    const arr = await map([1, 2, 3], (num: number) => Promise.resolve(num * 2))
    expect(arr).toEqual([2, 4, 6])
})

test('map, throw inside callback', async function () {
    await expect(map([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('map used with promises in a non-async function', async () => {
    let result: number[] = []
    try {
        result = await map([1, 2, 3], async function (num: number) {
            await delay()
            return num * 2
        })
    } catch (err) {
        // ignore
    }
    expect(result).toEqual([2, 4, 6])
})

test('map should return an empty array if passed array is empty', async () => {
    const count = 0
    const arr = await map([], async () => {
        await delay()
        return 3
    })
    expect(arr).toEqual([])
    expect(count).toEqual(0)
})

test('map should skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    await map([0, 1, 2, , 5, ,], async () => {
        count++
    })
    expect(count).toBe(4)
})

test('find', async () => {
    const foundNum = await find([1, 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return num === 2
    })
    expect(foundNum).toBe(2)
})

test('find, throw inside callback', async function () {
    await expect(find([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('find returns undefined if did not find anything', async () => {
    const foundNum = await find([1, 2], async () => {
        await delay()
        return false
    })
    expect(foundNum).toBe(undefined)
})

test('find returns undefined if array is empty', async () => {
    const foundNum = await find([], async () => {
        await delay()
        return false
    })
    expect(foundNum).toBe(undefined)
})

test('find unwraps Promises in the array', async () => {
    const foundNum = await find([1, Promise.resolve(2), 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(num)
        return num === 2
    })
    expect(foundNum).toBe(2)
})

test('find should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await find([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('find passing a non-async callback', async () => {
    const foundNum = await find([1, 2, 3], (num: number, index: number, array: number[]) => {
        expect(array[index]).toBe(num)
        return num === 2
    })
    expect(foundNum).toBe(2)
})

test('find should not skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    await find([0, 1, 2, , 5, ,], async () => {
        count++
    })
    expect(count).toBe(6)
})

test('findIndex', async () => {
    const foundIndex = await findIndex([1, 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return num === 2
    })
    expect(foundIndex).toBe(1)
})

test('findIndex, throw inside callback', async function () {
    await expect(findIndex([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('findIndex returns -1 if did not find anything', async () => {
    const notFound = await findIndex([1, 2], async () => {
        await delay()
        return false
    })
    expect(notFound).toBe(-1)
})

test('findIndex returns -1 if array is empty', async () => {
    const notFound = await findIndex([], async () => {
        await delay()
        return false
    })
    expect(notFound).toBe(-1)
})

test('findIndex unwraps Promises in the array', async () => {
    const foundIndex = await findIndex([Promise.resolve(1), 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(num)
        return num === 2
    })
    expect(foundIndex).toBe(1)
})

test('findIndex should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await findIndex([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('findIndex should not skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    await findIndex([0, 1, 2, , 5, ,], async () => {
        count++
    })
    expect(count).toBe(6)
})

test('some', async () => {
    const isIncluded = await some([1, 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return num === 3
    })
    expect(isIncluded).toBe(true)
})

test('some, throw inside callback', async function () {
    await expect(some([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('some should iterate until the end', async () => {
    const isIncluded = await some([500, 200, 400], async (num: number, index: number, array: number[]) => {
        await delay(num)
        expect(array[index]).toBe(num)
        return num === 500
    })
    expect(isIncluded).toBe(true)
})

test('some unwraps Promises in the array', async () => {
    const isIncluded = await some([1, Promise.resolve(2), 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(num)
        return num === 3
    })
    expect(isIncluded).toBe(true)
})

test('some should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await some([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('some passing a non-async callback', async () => {
    const isIncluded = await some([1, 2, 3], (num: number, index: number, array: number[]) => {
        expect(array[index]).toBe(num)
        return num === 3
    })
    expect(isIncluded).toBe(true)
})

test('some (return false)', async () => {
    const isIncluded = await some([1, 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return num === 4
    })
    expect(isIncluded).toBe(false)
})

test('some with empty array should return false', async () => {
    const isIncluded = await some([], async () => {
        await delay()
        return false
    })
    expect(isIncluded).toBe(false)
})

test('some should skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    await some([0, 1, 2, , 5, ,], async () => {
        count++
    })
    expect(count).toBe(4)
})

test('every', async () => {
    const allIncluded = await every([1, 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return typeof num === 'number'
    })
    expect(allIncluded).toBe(true)
})

test('every, throw inside callback', async function () {
    await expect(every([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('every should iterate until the end', async () => {
    const isIncluded = await every([500, 200, 400], async (num: number, index: number, array: number[]) => {
        await delay(num)
        expect(array[index]).toBe(num)
        return true
    })
    expect(isIncluded).toBe(true)
})

test('every unwraps Promises in the array', async () => {
    const allIncluded = await every([Promise.resolve(1), 2, 3], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(num)
        return typeof num === 'number'
    })
    expect(allIncluded).toBe(true)
})

test('every should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await every([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
        return true
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('every passing a non-async callback', async () => {
    const allIncluded = await every([1, 2, 3], (num: number, index: number, array: number[]) => {
        expect(array[index]).toBe(num)
        return typeof num === 'number'
    })
    expect(allIncluded).toBe(true)
})

test('every (return false)', async () => {
    const allIncluded = await every([1, 2, '3'], async (num: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(num)
        return typeof num === 'number'
    })
    expect(allIncluded).toBe(false)
})

test('every with empty array should return true', async () => {
    const allIncluded = await every([], async () => {
        await delay()
        return false
    })
    expect(allIncluded).toBe(true)
})

test('every should skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    const allIncluded = await every([0, 1, 2, , 5, ,], async () => {
        count++
        return true
    })
    expect(allIncluded).toBe(true)
    expect(count).toBe(4)
})

test('filter', async () => {
    const numbers = await filter([2, 1, '3', 4, '5'], async (num: number) => {
        await delay(num * 100)
        return typeof num === 'number'
    })
    expect(numbers).toEqual([2, 1, 4])
})

test('filter should skip holes in arrays', async () => {
    let count = 0
    // eslint-disable-next-line no-sparse-arrays
    const numbers = await filter([0, 1, 2, '3', , 5, '6', ,], async (num: number) => {
        await delay(num * 100)
        count++
        return typeof num === 'number'
    })
    expect(count).toBe(6)
    expect(numbers).toEqual([0, 1, 2, 5])
})

test('filter, check callbacks are run in parallel', async () => {
    const parallelCheck: number[] = []
    const numbers = await filter([2, 1, '3'], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        if (typeof num === 'number') {
            parallelCheck.push(num)
            return true
        }
    })
    expect(parallelCheck).toEqual([1, 2])
    expect(numbers).toEqual([2, 1])
})

test('filter, throw inside callback', async function () {
    await expect(filter([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('filter unwraps Promises in the array', async () => {
    const parallelCheck: number[] = []
    const numbers = await filter([Promise.resolve(2), 1, '3'], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(await Promise.resolve(array[index])).toBe(num)
        if (typeof num === 'number') {
            parallelCheck.push(num)
            return true
        }
    })
    expect(parallelCheck).toEqual([1, 2])
    expect(numbers).toEqual([2, 1])
})

test('filter should execute callbacks as soon as Promises are unwrapped', async () => {
    const parallelCheck: number[] = []
    await filter([delay(500), delay(300), delay(400)], (num: number) => {
        parallelCheck.push(num)
    })
    expect(parallelCheck).toEqual([300, 400, 500])
})

test('filter should return an empty array if passed array is empty', async () => {
    let count = 0
    const empty = await filter([], async () => {
        await delay()
        count++
        return true
    })
    expect(count).toEqual(0)
    expect(empty).toEqual([])
})

test('reduce with initialValue', async () => {
    const sum = await reduce([1, 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator + currentValue
    }, 1)
    expect(sum).toBe(7)
})

test('reduce with falsy initialValue', async () => {
    const sum = await reduce(['1', '2', '3'], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator + Number(currentValue)
    }, 0)
    expect(sum).toBe(6)

    const string = await reduce([1, 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator + String(currentValue)
    }, '')
    expect(string, '1).toBe(')

    const somePositive = await reduce([-1, 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator ? accumulator : currentValue > 0
    }, false)
    expect(somePositive).toBe(true)
})

test('reduce, throw inside callback', async function () {
    await expect(reduce([2, 1, 3], () => {
        throw new Error('test')
    })).rejects.toThrow('test')
})

test('reduce unwrap Promises in the array', async () => {
    const sum = await reduce([Promise.resolve(1), 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(currentValue)
        return accumulator + currentValue
    }, 1)
    expect(sum).toBe(7)
})

test('reduce unwrap Promises in the initialValue', async () => {
    const sum = await reduce([1, 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(await Promise.resolve(array[index])).toBe(currentValue)
        return accumulator + currentValue
    }, Promise.resolve(1))
    expect(sum).toBe(7)
})

test('reduce without initialValue', async () => {
    const sum = await reduce([1, 2, 3], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator + currentValue
    })
    expect(sum).toBe(6)
})

test('reduce of array with two elements without initialValue', async () => {
    const sum = await reduce([1, 2], async (accumulator: number, currentValue: number, index: number, array: number[]) => {
        await delay()
        expect(array[index]).toBe(currentValue)
        return accumulator + currentValue
    })
    expect(sum).toBe(3)
})

test('reduce of empty array without initialValue should throw TypeError', async () => {
    await expect(
        reduce([], async (accumulator: number, currentValue: number) => {
            await delay()
            return accumulator + currentValue
        })
    ).rejects.toThrow('Reduce of empty array with no initial value')
})

test('reduce of empty array with initialValue should return initialValue', async () => {
    let count = 0
    const sum = await reduce([], async (accumulator: number, currentValue: number) => {
        await delay()
        count++
        return accumulator + currentValue
    }, 6)
    expect(count).toBe(0)
    expect(sum).toBe(6)
})

test('reduce of array with one element and no initialValue should return that element', async () => {
    let count = 0
    const sum = await reduce([6], async (accumulator: number, currentValue: number) => {
        await delay()
        count++
        return accumulator + currentValue
    })
    expect(count).toBe(0)
    expect(sum).toBe(6)
})

test('forEachSeries', async () => {
    let total = 0
    const seriesCheck: number[] = []
    await forEachSeries([2, 1, 3], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        total += num
    })
    expect(seriesCheck).toEqual([2, 1, 3])
    expect(total).toBe(6)
})

test('mapSeries', async () => {
    const seriesCheck: number[] = []
    const arr = await mapSeries([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        return num * 2
    })
    expect(arr).toEqual([6, 2, 4])
    expect(seriesCheck).toEqual([3, 1, 2])
})

test('findSeries', async () => {
    const seriesCheck: number[] = []
    const foundNum = await findSeries([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        return num === 2
    })
    expect(foundNum).toBe(2)
    expect(seriesCheck).toEqual([3, 1, 2])
})

test('findIndexSeries', async () => {
    const seriesCheck: number[] = []
    const foundNum = await findIndexSeries([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        return num === 2
    })
    expect(foundNum).toBe(2)
    expect(seriesCheck).toEqual([3, 1, 2])
})

test('someSeries', async () => {
    const seriesCheck: number[] = []
    const isIncluded = await someSeries([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        return num === 2
    })
    expect(isIncluded).toBe(true)
    expect(seriesCheck).toEqual([3, 1, 2])
})

test('everySeries', async () => {
    const seriesCheck: number[] = []
    const allIncluded = await everySeries([3, 1, 2], async (num: number, index: number, array: number[]) => {
        await delay(num * 100)
        expect(array[index]).toBe(num)
        seriesCheck.push(num)
        return typeof num === 'number'
    })
    expect(allIncluded).toBe(true)
    expect(seriesCheck).toEqual([3, 1, 2])
})

test('filterSeries', async () => {
    const seriesCheck: number[] = []
    const numbers = await filterSeries([2, 1, '3'], async (num: number) => {
        await delay(num * 100)
        seriesCheck.push(num)
        return typeof num === 'number'
    })
    expect(numbers).toEqual([2, 1])
    expect(seriesCheck).toEqual([2, 1, '3'])
})
